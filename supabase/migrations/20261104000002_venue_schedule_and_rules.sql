begin;

alter table public.venues
  add column open_weekdays integer[] not null default array[0,1,2,3,4,5,6],
  add column venue_rules text not null default '';
alter table public.venues
  add constraint venues_open_weekdays_check check (
    cardinality(open_weekdays) between 1 and 7
    and open_weekdays <@ array[0,1,2,3,4,5,6]
  ),
  add constraint venues_rules_length_check check (char_length(venue_rules) <= 3000);

create table public.venue_closures (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint venue_closures_dates_check check (ends_on >= starts_on),
  constraint venue_closures_reason_check check (char_length(reason) <= 120),
  constraint venue_closures_unique_period unique (venue_id, starts_on, ends_on)
);
create index venue_closures_lookup_idx on public.venue_closures(venue_id, starts_on, ends_on);
alter table public.venue_closures enable row level security;
create policy "Members view venue closures" on public.venue_closures
  for select to authenticated using (exists (
    select 1 from public.venues v where v.id = venue_id
      and (v.status = 'active' or v.owner_id = (select auth.uid()))
  ));
create policy "Owners add venue closures" on public.venue_closures
  for insert to authenticated with check (exists (
    select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())
  ));
create policy "Owners remove venue closures" on public.venue_closures
  for delete to authenticated using (exists (
    select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())
  ));
revoke all on public.venue_closures from public, anon, authenticated;
grant select, insert, delete on public.venue_closures to authenticated;

create function public.prevent_closure_with_bookings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.court_bookings b
    where b.venue_id = new.venue_id and b.status in ('pending_payment', 'confirmed')
      and (b.starts_at at time zone 'Asia/Jakarta')::date between new.starts_on and new.ends_on
  ) then
    raise exception 'Existing bookings fall within this closure period';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_closure_with_bookings() from public, anon, authenticated;
create trigger venue_closures_no_existing_bookings
  before insert or update on public.venue_closures
  for each row execute function public.prevent_closure_with_bookings();

create function public.validate_venue_booking_date() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_weekdays integer[];
  v_date date;
  v_max_date date;
begin
  if new.status not in ('pending_payment', 'confirmed') then return new; end if;
  v_date := (new.starts_at at time zone 'Asia/Jakarta')::date;
  v_max_date := ((now() at time zone 'Asia/Jakarta')::date + interval '1 month')::date;
  if v_date < (now() at time zone 'Asia/Jakarta')::date or v_date > v_max_date then
    raise exception 'Booking date is outside the one-month window';
  end if;
  select v.open_weekdays into v_weekdays from public.venues v where v.id = new.venue_id;
  if not (extract(dow from v_date)::integer = any(v_weekdays)) then
    raise exception 'Venue is closed on this weekday';
  end if;
  if exists (
    select 1 from public.venue_closures c
    where c.venue_id = new.venue_id and v_date between c.starts_on and c.ends_on
  ) then
    raise exception 'Venue is closed on this date';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_venue_booking_date() from public, anon, authenticated;
create trigger court_bookings_validate_venue_date
  before insert or update of starts_at, ends_at, status, venue_id on public.court_bookings
  for each row execute function public.validate_venue_booking_date();

create or replace function public.venue_busy_slots(p_venue_id uuid)
returns table(court_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select b.court_id, b.starts_at, b.ends_at
  from public.court_bookings b join public.venues v on v.id = b.venue_id
  where auth.uid() is not null and v.status = 'active' and b.venue_id = p_venue_id
    and b.status in ('pending_payment','confirmed') and b.starts_at >= now()
  order by b.starts_at limit 1000;
$$;

commit;
