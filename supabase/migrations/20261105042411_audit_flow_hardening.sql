-- Keep cancelled history while releasing bookings; prevent privilege escalation.
begin;

alter policy "Players join communities" on public.community_members with check (
  user_id = (select auth.uid()) and role = 'member'
  and coalesce((select auth.jwt()->'app_metadata'->>'smashmate_role'),'player') = 'player'
);
alter policy "Players create communities" on public.communities with check (
  owner_id = (select auth.uid())
  and coalesce((select auth.jwt()->'app_metadata'->>'smashmate_role'),'player') = 'player'
);

create unique index activities_one_active_booking_idx on public.activities(booking_id)
  where booking_id is not null and cancelled_at is null;

create function public.validate_activity_booking() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.booking_id is not null and new.cancelled_at is null and not exists (
    select 1 from public.court_bookings b where b.id=new.booking_id
      and b.player_id=new.host_id and b.status='confirmed'
      and b.starts_at=new.starts_at
      and b.ends_at=new.starts_at+new.duration_minutes*interval '1 minute'
  ) then raise exception 'Activity must match its confirmed host booking'; end if;
  return new;
end $$;
revoke all on function public.validate_activity_booking() from public,anon,authenticated;
create trigger validate_activity_booking before insert or update on public.activities
  for each row execute function public.validate_activity_booking();

-- Explicit table qualification avoids the old b.starts_at = b.starts_at tautology.
alter policy "Users create their own activities" on public.activities with check (
  host_id = (select auth.uid()) and starts_at > now()
  and coalesce((select auth.jwt()->'app_metadata'->>'smashmate_role'),'player') = 'player'
  and (booking_id is null or exists (
    select 1 from public.court_bookings b where b.id = activities.booking_id
      and b.player_id = (select auth.uid()) and b.status = 'confirmed'
      and b.starts_at = activities.starts_at
      and b.ends_at = activities.starts_at + activities.duration_minutes * interval '1 minute'
  ))
  and (community_id is null or exists (
    select 1 from public.communities c where c.id = activities.community_id
      and (c.owner_id = (select auth.uid()) or exists (
        select 1 from public.community_members m where m.community_id=c.id
          and m.user_id=(select auth.uid()) and m.role='admin'
      ))
  ))
);
alter policy "Hosts can update future activities" on public.activities with check (
  host_id = (select auth.uid()) and starts_at > now()
  and coalesce((select auth.jwt()->'app_metadata'->>'smashmate_role'),'player') = 'player'
  and (booking_id is null or exists (
    select 1 from public.court_bookings b where b.id = activities.booking_id
      and b.player_id = (select auth.uid()) and b.status = 'confirmed'
      and b.starts_at = activities.starts_at
      and b.ends_at = activities.starts_at + activities.duration_minutes * interval '1 minute'
  ))
  and (community_id is null or exists (
    select 1 from public.communities c where c.id = activities.community_id
      and (c.owner_id = (select auth.uid()) or exists (
        select 1 from public.community_members m where m.community_id=c.id
          and m.user_id=(select auth.uid()) and m.role='admin'
      ))
  ))
);

create or replace function public.guard_activity_history() returns trigger
language plpgsql set search_path='' as $$
begin
  if old.cancelled_at is not null then raise exception 'Cancelled activity cannot be changed'; end if;
  if new.host_id<>old.host_id or new.community_id is distinct from old.community_id
    or new.sparring_opponent_id is distinct from old.sparring_opponent_id
    or new.booking_id is distinct from old.booking_id then
    raise exception 'Activity ownership and booking cannot change';
  end if;
  if new.cancelled_at is not null and new.cancelled_at>now()+interval '1 minute' then
    raise exception 'Invalid cancellation time';
  end if;
  if new.capacity < 1 + (select count(*) from public.activity_participants where activity_id=old.id) then
    raise exception 'Capacity is below current attendance';
  end if;
  return new;
end $$;

create or replace function public.cancel_court_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_booking public.court_bookings%rowtype; v_item record;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_booking from public.court_bookings where id=p_booking_id for update;
  if not found or v_booking.status='cancelled' or v_booking.starts_at<=now()
    or (v_booking.player_id<>auth.uid() and not exists (
      select 1 from public.venues where id=v_booking.venue_id and owner_id=auth.uid()
    )) then raise exception 'Booking unavailable'; end if;
  if exists (select 1 from public.activities where booking_id=p_booking_id and cancelled_at is null) then
    raise exception 'Cancel linked activity before cancelling booking';
  end if;
  if exists (select 1 from public.sparring_invitations where booking_id=p_booking_id and status='pending') then
    raise exception 'Cancel pending sparring invitation before cancelling booking';
  end if;
  update public.court_bookings set status='cancelled' where id=p_booking_id;
  if v_booking.shuttle_product_id is not null then
    update public.venue_products set stock=stock+v_booking.shuttle_quantity where id=v_booking.shuttle_product_id;
  end if;
  for v_item in select product_id,quantity from public.court_booking_items
    where booking_id=p_booking_id and kind='shuttlecock_sale' loop
    update public.venue_products set stock=stock+v_item.quantity where id=v_item.product_id;
  end loop;
end $$;
revoke all on function public.cancel_court_booking(uuid) from public,anon;
grant execute on function public.cancel_court_booking(uuid) to authenticated;

-- Include bookings already in progress when exposing occupied intervals.
create or replace function public.venue_busy_slots(p_venue_id uuid)
returns table(court_id uuid,starts_at timestamptz,ends_at timestamptz)
language sql stable security definer set search_path='' as $$
  select b.court_id,b.starts_at,b.ends_at from public.court_bookings b
  join public.venues v on v.id=b.venue_id
  where auth.uid() is not null and v.status='active' and b.venue_id=p_venue_id
    and b.status in ('pending_payment','confirmed') and b.ends_at>now()
  order by b.starts_at limit 1000;
$$;
revoke all on function public.venue_busy_slots(uuid) from public,anon;
grant execute on function public.venue_busy_slots(uuid) to authenticated;

commit;
