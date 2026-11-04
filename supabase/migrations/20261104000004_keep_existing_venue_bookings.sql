create function public.keep_existing_venue_bookings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.court_bookings b
    where b.venue_id = new.id and b.status in ('pending_payment', 'confirmed')
      and b.starts_at > now()
      and (
        not (extract(dow from b.starts_at at time zone 'Asia/Jakarta')::integer = any(new.open_weekdays))
        or (b.starts_at at time zone 'Asia/Jakarta')::time < new.open_time
        or (b.ends_at at time zone 'Asia/Jakarta')::time > new.close_time
      )
  ) then
    raise exception 'New opening hours conflict with an existing booking';
  end if;
  return new;
end;
$$;
revoke all on function public.keep_existing_venue_bookings() from public, anon, authenticated;
create trigger venues_keep_existing_bookings
  before update of open_weekdays, open_time, close_time on public.venues
  for each row execute function public.keep_existing_venue_bookings();
