begin;

create table public.court_booking_items (
  booking_id uuid not null references public.court_bookings(id) on delete cascade,
  product_id uuid not null references public.venue_products(id),
  kind text not null check (kind in ('racket_rental', 'shuttlecock_sale')),
  product_name text not null check (char_length(product_name) between 3 and 100),
  quantity integer not null check (quantity between 1 and 100),
  unit_price integer not null check (unit_price between 0 and 10000000),
  image_path text,
  primary key (booking_id, product_id)
);
create index court_booking_items_product_idx on public.court_booking_items(product_id);
alter table public.court_booking_items enable row level security;
create policy "Booking parties view items" on public.court_booking_items
  for select to authenticated using (exists (
    select 1 from public.court_bookings b
    where b.id = booking_id and (b.player_id = (select auth.uid()) or exists (
      select 1 from public.venues v where v.id = b.venue_id and v.owner_id = (select auth.uid())
    ))
  ));
revoke all on public.court_booking_items from public, anon, authenticated;
grant select on public.court_booking_items to authenticated;

create function public.book_court_with_items(
  p_court_id uuid, p_starts_at timestamptz, p_duration_minutes integer, p_items jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_court public.courts%rowtype;
  v_venue public.venues%rowtype;
  v_product public.venue_products%rowtype;
  v_entry jsonb;
  v_end timestamptz;
  v_name text;
  v_id uuid;
  v_product_id uuid;
  v_quantity integer;
  v_seen uuid[] := '{}';
  v_racket_total integer := 0;
  v_shuttle_total integer := 0;
  v_reserved integer;
  v_total integer;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'smashmate_role', 'player') <> 'player'
    then raise exception 'Player account required'; end if;
  if p_court_id is null or p_starts_at is null or p_duration_minutes not between 60 and 480
    or p_duration_minutes % 60 <> 0 or p_starts_at <= now()
    or p_starts_at > now() + interval '365 days'
    or p_items is null or jsonb_typeof(p_items) <> 'array'
    then raise exception 'Invalid booking'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'Too many products'; end if;

  select * into v_court from public.courts where id = p_court_id for update;
  if not found or not v_court.is_active then raise exception 'Court unavailable'; end if;
  select * into v_venue from public.venues where id = v_court.venue_id;
  if not found or v_venue.status <> 'active' then raise exception 'Venue unavailable'; end if;
  v_end := p_starts_at + make_interval(mins => p_duration_minutes);
  if (p_starts_at at time zone 'Asia/Jakarta')::time < v_venue.open_time
    or (v_end at time zone 'Asia/Jakarta')::time > v_venue.close_time
    or (v_end at time zone 'Asia/Jakarta')::date <> (p_starts_at at time zone 'Asia/Jakarta')::date
    then raise exception 'Outside venue hours'; end if;
  if exists (select 1 from public.court_bookings b where b.court_id = p_court_id
    and b.status in ('pending_payment','confirmed')
    and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)'))
    then raise exception 'Slot already booked'; end if;

  v_total := v_court.price_per_hour * (p_duration_minutes / 60);
  for v_entry in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
    if jsonb_typeof(v_entry) <> 'object'
      or coalesce(v_entry->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(v_entry->>'quantity','') !~ '^[1-9][0-9]{0,2}$'
      then raise exception 'Invalid item'; end if;
    v_product_id := (v_entry->>'product_id')::uuid;
    v_quantity := (v_entry->>'quantity')::integer;
    if v_product_id = any(v_seen) then raise exception 'Duplicate item'; end if;
    v_seen := array_append(v_seen, v_product_id);
    select * into v_product from public.venue_products where id = v_product_id for update;
    if not found or v_product.venue_id <> v_venue.id or not v_product.is_active
      then raise exception 'Product unavailable'; end if;

    if v_product.kind = 'racket_rental' then
      v_racket_total := v_racket_total + v_quantity;
      if v_racket_total > 20 then raise exception 'Too many rackets'; end if;
      select coalesce(sum(b.racket_quantity), 0) into v_reserved
      from public.court_bookings b where b.racket_product_id = v_product_id
        and b.status in ('pending_payment','confirmed')
        and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)');
      select v_reserved + coalesce(sum(i.quantity), 0) into v_reserved
      from public.court_booking_items i join public.court_bookings b on b.id = i.booking_id
      where i.product_id = v_product_id and b.status in ('pending_payment','confirmed')
        and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)');
      if v_reserved + v_quantity > v_product.stock then raise exception 'Racket stock unavailable'; end if;
    else
      v_shuttle_total := v_shuttle_total + v_quantity;
      if v_shuttle_total > 100 or v_quantity > v_product.stock
        then raise exception 'Shuttlecock stock unavailable'; end if;
      update public.venue_products set stock = stock - v_quantity where id = v_product_id;
    end if;
    v_total := v_total + v_product.price * v_quantity;
  end loop;

  select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''), split_part(email,'@',1), 'Pemain'),60)
    into v_name from auth.users where id = auth.uid();
  insert into public.court_bookings(court_id, venue_id, player_id, player_name,
    starts_at, ends_at, court_price, total_amount)
  values (p_court_id, v_venue.id, auth.uid(), coalesce(v_name,'Pemain'),
    p_starts_at, v_end, v_court.price_per_hour * (p_duration_minutes / 60), v_total)
  returning id into v_id;

  for v_entry in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
    insert into public.court_booking_items(booking_id, product_id, kind, product_name,
      quantity, unit_price, image_path)
    select v_id, p.id, p.kind, p.name, (v_entry->>'quantity')::integer, p.price, p.image_path
    from public.venue_products p where p.id = (v_entry->>'product_id')::uuid;
  end loop;
  return v_id;
end;
$$;
revoke all on function public.book_court_with_items(uuid,timestamptz,integer,jsonb) from public, anon;
grant execute on function public.book_court_with_items(uuid,timestamptz,integer,jsonb) to authenticated;

create or replace function public.cancel_court_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_booking public.court_bookings%rowtype; v_item record;
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
  for v_item in select product_id, quantity from public.court_booking_items
    where booking_id = p_booking_id and kind = 'shuttlecock_sale' loop
    update public.venue_products set stock = stock + v_item.quantity where id = v_item.product_id;
  end loop;
end;
$$;

commit;
