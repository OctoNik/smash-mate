-- Venue marketplace and demo checkout. No real payment is processed.
begin;

create extension if not exists btree_gist;

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  address text not null default '' check (char_length(address) <= 250),
  maps_url text not null default '' check (char_length(maps_url) <= 500 and (maps_url = '' or maps_url ~ '^https://')),
  contact_phone text not null default '' check (char_length(contact_phone) <= 30),
  open_time time not null default '07:00',
  close_time time not null default '22:00',
  status text not null default 'draft' check (status in ('draft','active')),
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);
create index venues_owner_idx on public.venues(owner_id);
alter table public.venues enable row level security;
create policy "Authenticated users view active or owned venues" on public.venues
  for select to authenticated using (
    status = 'active' or owner_id = (select auth.uid())
    or (select auth.jwt()->'app_metadata'->>'smashmate_role') = 'operator'
  );
create policy "Owners edit venue details" on public.venues
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
revoke all on public.venues from anon, authenticated;
grant select on public.venues to authenticated;
grant update (name, description, address, maps_url, contact_phone, open_time, close_time)
  on public.venues to authenticated;

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  price_per_hour integer not null check (price_per_hour between 0 and 10000000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (venue_id, name)
);
create index courts_venue_idx on public.courts(venue_id);
alter table public.courts enable row level security;
create policy "Users view courts of accessible venues" on public.courts
  for select to authenticated using (
    exists (select 1 from public.venues v where v.id = venue_id)
  );
create policy "Owners add courts" on public.courts for insert to authenticated
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())));
create policy "Owners edit courts" on public.courts for update to authenticated
  using (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())));
revoke all on public.courts from anon, authenticated;
grant select, insert on public.courts to authenticated;
grant update (name, price_per_hour, is_active) on public.courts to authenticated;

create table public.venue_products (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  kind text not null check (kind in ('racket_rental','shuttlecock_sale')),
  name text not null check (char_length(name) between 3 and 100),
  description text not null default '' check (char_length(description) <= 500),
  price integer not null check (price between 0 and 10000000),
  stock integer not null check (stock between 0 and 100000),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index venue_products_venue_idx on public.venue_products(venue_id);
alter table public.venue_products enable row level security;
create policy "Users view active products or owned products" on public.venue_products
  for select to authenticated using (
    exists (select 1 from public.venues v where v.id = venue_id and
      ((v.status = 'active' and is_active) or v.owner_id = (select auth.uid())))
  );
create policy "Owners add products" on public.venue_products for insert to authenticated
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())));
create policy "Owners edit products" on public.venue_products for update to authenticated
  using (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())));
revoke all on public.venue_products from anon, authenticated;
grant select, insert on public.venue_products to authenticated;
grant update (name, description, price, stock, image_path, is_active)
  on public.venue_products to authenticated;

create table public.court_bookings (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id),
  venue_id uuid not null references public.venues(id),
  player_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 60),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  racket_product_id uuid references public.venue_products(id),
  racket_quantity integer not null default 0 check (racket_quantity between 0 and 20),
  shuttle_product_id uuid references public.venue_products(id),
  shuttle_quantity integer not null default 0 check (shuttle_quantity between 0 and 100),
  court_price integer not null check (court_price >= 0),
  racket_price integer not null default 0 check (racket_price >= 0),
  shuttle_price integer not null default 0 check (shuttle_price >= 0),
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'pending_payment' check (status in ('pending_payment','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((racket_quantity = 0 and racket_product_id is null) or (racket_quantity > 0 and racket_product_id is not null)),
  check ((shuttle_quantity = 0 and shuttle_product_id is null) or (shuttle_quantity > 0 and shuttle_product_id is not null))
);
alter table public.court_bookings add constraint court_bookings_no_overlap
  exclude using gist (court_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
  where (status in ('pending_payment','confirmed'));
create index court_bookings_player_idx on public.court_bookings(player_id, starts_at desc);
create index court_bookings_venue_idx on public.court_bookings(venue_id, starts_at);
alter table public.court_bookings enable row level security;
create policy "Players and venue owners view bookings" on public.court_bookings
  for select to authenticated using (
    player_id = (select auth.uid()) or
    exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid()))
  );
revoke all on public.court_bookings from anon, authenticated;
grant select on public.court_bookings to authenticated;

create table public.venue_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.venue_products(id),
  venue_id uuid not null references public.venues(id),
  player_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 60),
  quantity integer not null check (quantity between 1 and 100),
  unit_price integer not null check (unit_price >= 0),
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'pending_payment' check (status in ('pending_payment','confirmed','cancelled')),
  created_at timestamptz not null default now()
);
create index venue_orders_player_idx on public.venue_orders(player_id, created_at desc);
create index venue_orders_venue_idx on public.venue_orders(venue_id, created_at desc);
alter table public.venue_orders enable row level security;
create policy "Players and venue owners view orders" on public.venue_orders
  for select to authenticated using (
    player_id = (select auth.uid()) or
    exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid()))
  );
revoke all on public.venue_orders from anon, authenticated;
grant select on public.venue_orders to authenticated;

create function public.publish_venue(
  p_venue_id uuid, p_name text, p_description text, p_address text, p_maps_url text,
  p_contact_phone text, p_open_time time, p_close_time time, p_court_count integer, p_court_price integer
) returns void language plpgsql security definer set search_path = '' as $$
declare v_venue public.venues%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_venue from public.venues where id = p_venue_id for update;
  if not found or v_venue.owner_id <> auth.uid() or v_venue.status <> 'draft' then raise exception 'Venue unavailable'; end if;
  if char_length(btrim(p_name)) not between 3 and 100 or char_length(btrim(p_address)) < 10
    or char_length(p_description) > 2000 or char_length(p_maps_url) > 500
    or p_maps_url !~ '^https://' or char_length(p_contact_phone) > 30
    or p_open_time >= p_close_time or p_court_count not between 1 and 30
    or p_court_price not between 0 and 10000000 then raise exception 'Invalid venue details'; end if;
  if exists (select 1 from public.courts where venue_id = p_venue_id) then raise exception 'Courts already exist'; end if;
  update public.venues set name=btrim(p_name), description=coalesce(p_description,''),
    address=btrim(p_address), maps_url=p_maps_url, contact_phone=coalesce(p_contact_phone,''),
    open_time=p_open_time, close_time=p_close_time, status='active' where id=p_venue_id;
  insert into public.courts(venue_id,name,price_per_hour)
    select p_venue_id, 'Lapangan ' || n, p_court_price from generate_series(1,p_court_count) as n;
end;
$$;
revoke all on function public.publish_venue(uuid,text,text,text,text,text,time,time,integer,integer) from public, anon;
grant execute on function public.publish_venue(uuid,text,text,text,text,text,time,time,integer,integer) to authenticated;

create function public.book_court(
  p_court_id uuid, p_starts_at timestamptz, p_duration_minutes integer,
  p_racket_product_id uuid default null, p_racket_quantity integer default 0,
  p_shuttle_product_id uuid default null, p_shuttle_quantity integer default 0
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_court public.courts%rowtype;
  v_venue public.venues%rowtype;
  v_racket public.venue_products%rowtype;
  v_shuttle public.venue_products%rowtype;
  v_end timestamptz;
  v_name text;
  v_id uuid;
  v_rental_count integer;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if p_duration_minutes not in (60,120) or p_starts_at <= now() or p_starts_at > now()+interval '365 days'
    or p_racket_quantity not between 0 and 20 or p_shuttle_quantity not between 0 and 100
    or (p_racket_quantity = 0) <> (p_racket_product_id is null)
    or (p_shuttle_quantity = 0) <> (p_shuttle_product_id is null)
    then raise exception 'Invalid booking'; end if;
  select * into v_court from public.courts where id=p_court_id for update;
  if not found or not v_court.is_active then raise exception 'Court unavailable'; end if;
  select * into v_venue from public.venues where id=v_court.venue_id;
  if v_venue.status <> 'active' then raise exception 'Venue unavailable'; end if;
  v_end := p_starts_at + make_interval(mins => p_duration_minutes);
  if (p_starts_at at time zone 'Asia/Jakarta')::time < v_venue.open_time
    or (v_end at time zone 'Asia/Jakarta')::time > v_venue.close_time
    or (v_end at time zone 'Asia/Jakarta')::date <> (p_starts_at at time zone 'Asia/Jakarta')::date
    then raise exception 'Outside venue hours'; end if;
  if exists (select 1 from public.court_bookings b where b.court_id=p_court_id
    and b.status in ('pending_payment','confirmed')
    and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)'))
    then raise exception 'Slot already booked'; end if;
  if p_racket_quantity > 0 then
    select * into v_racket from public.venue_products where id=p_racket_product_id for update;
    if not found or v_racket.venue_id <> v_venue.id or v_racket.kind <> 'racket_rental' or not v_racket.is_active
      then raise exception 'Racket unavailable'; end if;
    select coalesce(sum(racket_quantity),0) into v_rental_count from public.court_bookings
      where racket_product_id=p_racket_product_id and status in ('pending_payment','confirmed')
      and tstzrange(starts_at,ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)');
    if v_rental_count + p_racket_quantity > v_racket.stock then raise exception 'Racket stock unavailable'; end if;
  end if;
  if p_shuttle_quantity > 0 then
    select * into v_shuttle from public.venue_products where id=p_shuttle_product_id for update;
    if not found or v_shuttle.venue_id <> v_venue.id or v_shuttle.kind <> 'shuttlecock_sale'
      or not v_shuttle.is_active or v_shuttle.stock < p_shuttle_quantity
      then raise exception 'Shuttlecock stock unavailable'; end if;
    update public.venue_products set stock=stock-p_shuttle_quantity where id=p_shuttle_product_id;
  end if;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''),split_part(email,'@',1),'Pemain'),60)
    into v_name from auth.users where id=auth.uid();
  insert into public.court_bookings(court_id,venue_id,player_id,player_name,starts_at,ends_at,
    racket_product_id,racket_quantity,shuttle_product_id,shuttle_quantity,
    court_price,racket_price,shuttle_price,total_amount)
    values (p_court_id,v_venue.id,auth.uid(),coalesce(v_name,'Pemain'),p_starts_at,v_end,
      p_racket_product_id,p_racket_quantity,p_shuttle_product_id,p_shuttle_quantity,
      v_court.price_per_hour*(p_duration_minutes/60),coalesce(v_racket.price,0),
      coalesce(v_shuttle.price,0),
      v_court.price_per_hour*(p_duration_minutes/60)+coalesce(v_racket.price,0)*p_racket_quantity+
      coalesce(v_shuttle.price,0)*p_shuttle_quantity)
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.book_court(uuid,timestamptz,integer,uuid,integer,uuid,integer) from public, anon;
grant execute on function public.book_court(uuid,timestamptz,integer,uuid,integer,uuid,integer) to authenticated;

create function public.demo_pay_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  update public.court_bookings set status='confirmed' where id=p_booking_id
    and player_id=auth.uid() and status='pending_payment' and starts_at>now();
  if not found then raise exception 'Booking unavailable'; end if;
end;
$$;
revoke all on function public.demo_pay_booking(uuid) from public, anon;
grant execute on function public.demo_pay_booking(uuid) to authenticated;

create function public.cancel_court_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_booking public.court_bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_booking from public.court_bookings where id=p_booking_id for update;
  if not found or v_booking.status='cancelled' or v_booking.starts_at<=now()
    or (v_booking.player_id<>auth.uid() and not exists (
      select 1 from public.venues where id=v_booking.venue_id and owner_id=auth.uid()))
    then raise exception 'Booking unavailable'; end if;
  update public.court_bookings set status='cancelled' where id=p_booking_id;
  if v_booking.shuttle_product_id is not null then
    update public.venue_products set stock=stock+v_booking.shuttle_quantity
      where id=v_booking.shuttle_product_id;
  end if;
end;
$$;
revoke all on function public.cancel_court_booking(uuid) from public, anon;
grant execute on function public.cancel_court_booking(uuid) to authenticated;

create function public.purchase_shuttlecock(p_product_id uuid,p_quantity integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_product public.venue_products%rowtype; v_name text; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if p_quantity not between 1 and 100 then raise exception 'Invalid quantity'; end if;
  select * into v_product from public.venue_products where id=p_product_id for update;
  if not found or v_product.kind<>'shuttlecock_sale' or not v_product.is_active
    or v_product.stock<p_quantity or not exists (
      select 1 from public.venues where id=v_product.venue_id and status='active')
    then raise exception 'Product unavailable'; end if;
  update public.venue_products set stock=stock-p_quantity where id=p_product_id;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''),split_part(email,'@',1),'Pemain'),60)
    into v_name from auth.users where id=auth.uid();
  insert into public.venue_orders(product_id,venue_id,player_id,player_name,quantity,unit_price,total_amount)
    values(p_product_id,v_product.venue_id,auth.uid(),coalesce(v_name,'Pemain'),p_quantity,
      v_product.price,p_quantity*v_product.price) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.purchase_shuttlecock(uuid,integer) from public, anon;
grant execute on function public.purchase_shuttlecock(uuid,integer) to authenticated;

create function public.demo_pay_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  update public.venue_orders set status='confirmed' where id=p_order_id
    and player_id=auth.uid() and status='pending_payment';
  if not found then raise exception 'Order unavailable'; end if;
end;
$$;
revoke all on function public.demo_pay_order(uuid) from public, anon;
grant execute on function public.demo_pay_order(uuid) to authenticated;

create function public.cancel_venue_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.venue_orders%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_order from public.venue_orders where id=p_order_id for update;
  if not found or v_order.status='cancelled'
    or (v_order.player_id<>auth.uid() and not exists (
      select 1 from public.venues where id=v_order.venue_id and owner_id=auth.uid()))
    then raise exception 'Order unavailable'; end if;
  update public.venue_orders set status='cancelled' where id=p_order_id;
  update public.venue_products set stock=stock+v_order.quantity where id=v_order.product_id;
end;
$$;
revoke all on function public.cancel_venue_order(uuid) from public, anon;
grant execute on function public.cancel_venue_order(uuid) to authenticated;

alter table public.activities add column booking_id uuid references public.court_bookings(id) on delete set null;
alter policy "Users create their own activities" on public.activities
  with check (
    host_id=(select auth.uid()) and starts_at>now() and
    (booking_id is null or exists (
      select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid())
        and b.status='confirmed' and b.starts_at=starts_at
    ))
  );
alter policy "Hosts can update future activities" on public.activities
  using (host_id=(select auth.uid()) and starts_at>now())
  with check (
    host_id=(select auth.uid()) and starts_at>now() and
    (booking_id is null or exists (
      select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid())
        and b.status='confirmed' and b.starts_at=starts_at
    ))
  );

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('venue-products','venue-products',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Venue owners read product images" on storage.objects
  for select to authenticated using (
    bucket_id='venue-products' and exists (
      select 1 from public.venues v where v.id::text=split_part(name,'/',1)
        and v.owner_id=(select auth.uid())
    )
  );
create policy "Venue owners upload product images" on storage.objects
  for insert to authenticated with check (
    bucket_id='venue-products' and exists (
      select 1 from public.venues v where v.id::text=split_part(name,'/',1)
        and v.owner_id=(select auth.uid())
    )
  );
create policy "Venue owners replace product images" on storage.objects
  for update to authenticated using (
    bucket_id='venue-products' and exists (
      select 1 from public.venues v where v.id::text=split_part(name,'/',1)
        and v.owner_id=(select auth.uid())
    )
  ) with check (
    bucket_id='venue-products' and exists (
      select 1 from public.venues v where v.id::text=split_part(name,'/',1)
        and v.owner_id=(select auth.uid())
    )
  );
create policy "Venue owners delete product images" on storage.objects
  for delete to authenticated using (
    bucket_id='venue-products' and exists (
      select 1 from public.venues v where v.id::text=split_part(name,'/',1)
        and v.owner_id=(select auth.uid())
    )
  );

commit;
