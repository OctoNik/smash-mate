begin;

alter extension btree_gist set schema extensions;

alter policy "Authenticated users view active or owned venues" on public.venues
  using (status = 'active' or owner_id = (select auth.uid())
    or (select auth.jwt()->'app_metadata'->>'smashmate_role') = 'operator');

alter policy "Players leave communities" on public.community_members
  using (user_id = (select auth.uid()) and not exists (
    select 1 from public.communities c where c.id = community_id and c.owner_id = (select auth.uid())
  ));

create index activities_booking_idx on public.activities(booking_id) where booking_id is not null;
create index activities_community_idx on public.activities(community_id) where community_id is not null;
create index court_bookings_racket_idx on public.court_bookings(racket_product_id) where racket_product_id is not null;
create index court_bookings_shuttle_idx on public.court_bookings(shuttle_product_id) where shuttle_product_id is not null;
create index venue_orders_product_idx on public.venue_orders(product_id);

create or replace function public.cancel_court_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_booking public.court_bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_booking from public.court_bookings where id=p_booking_id for update;
  if not found or v_booking.status='cancelled' or v_booking.starts_at<=now()
    or (v_booking.player_id<>auth.uid() and not exists (
      select 1 from public.venues where id=v_booking.venue_id and owner_id=auth.uid()))
    then raise exception 'Booking unavailable'; end if;
  if exists (select 1 from public.activities where booking_id=p_booking_id) then
    raise exception 'Delete linked activity before cancelling booking';
  end if;
  update public.court_bookings set status='cancelled' where id=p_booking_id;
  if v_booking.shuttle_product_id is not null then
    update public.venue_products set stock=stock+v_booking.shuttle_quantity
      where id=v_booking.shuttle_product_id;
  end if;
end;
$$;

commit;
