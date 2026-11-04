create function public.publish_venue_complete(
  p_venue_id uuid, p_name text, p_description text, p_rules text,
  p_address text, p_maps_url text, p_contact_phone text,
  p_open_time time, p_close_time time, p_open_weekdays integer[],
  p_courts jsonb, p_products jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare v_venue public.venues%rowtype; v_item jsonb;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'smashmate_role','') <> 'partner' then
    raise exception 'Partner account required';
  end if;
  select * into v_venue from public.venues where id=p_venue_id for update;
  if not found or v_venue.owner_id<>auth.uid() or v_venue.status<>'draft' then raise exception 'Venue unavailable'; end if;
  if char_length(btrim(p_name)) not between 3 and 100 or char_length(coalesce(p_description,''))>2000
    or char_length(coalesce(p_rules,''))>3000 or char_length(btrim(p_address)) not between 10 and 250
    or char_length(coalesce(p_contact_phone,''))>30 or p_open_time>=p_close_time
    or p_maps_url !~ '^https://(www\.google\.com|google\.com|maps\.google\.com|maps\.app\.goo\.gl)/'
    or cardinality(p_open_weekdays) not between 1 and 7
    or not (p_open_weekdays <@ array[0,1,2,3,4,5,6])
    or jsonb_typeof(p_courts)<>'array' or jsonb_array_length(p_courts) not between 1 and 30
    or jsonb_typeof(p_products)<>'array' or jsonb_array_length(p_products)>30
    then raise exception 'Invalid venue details'; end if;
  if exists (select 1 from public.courts where venue_id=p_venue_id) then raise exception 'Courts already exist'; end if;
  update public.venues set name=btrim(p_name), description=coalesce(p_description,''), venue_rules=coalesce(p_rules,''),
    address=btrim(p_address), maps_url=p_maps_url, contact_phone=coalesce(p_contact_phone,''),
    open_time=p_open_time, close_time=p_close_time, open_weekdays=p_open_weekdays, status='active'
    where id=p_venue_id;
  for v_item in select value from jsonb_array_elements(p_courts) loop
    if jsonb_typeof(v_item)<>'object' or char_length(btrim(coalesce(v_item->>'name',''))) not between 1 and 60
      or coalesce(v_item->>'price','') !~ '^[0-9]{1,8}$' or (v_item->>'price')::integer>10000000
      then raise exception 'Invalid court'; end if;
    insert into public.courts(venue_id,name,price_per_hour)
      values(p_venue_id,btrim(v_item->>'name'),(v_item->>'price')::integer);
  end loop;
  for v_item in select value from jsonb_array_elements(p_products) loop
    if jsonb_typeof(v_item)<>'object' or v_item->>'kind' not in ('racket_rental','shuttlecock_sale')
      or char_length(btrim(coalesce(v_item->>'name',''))) not between 3 and 100
      or char_length(coalesce(v_item->>'description',''))>500
      or coalesce(v_item->>'price','') !~ '^[0-9]{1,8}$' or (v_item->>'price')::integer>10000000
      or coalesce(v_item->>'stock','') !~ '^[0-9]{1,6}$' or (v_item->>'stock')::integer>100000
      then raise exception 'Invalid product'; end if;
    insert into public.venue_products(venue_id,kind,name,description,price,stock)
      values(p_venue_id,v_item->>'kind',btrim(v_item->>'name'),coalesce(v_item->>'description',''),
        (v_item->>'price')::integer,(v_item->>'stock')::integer);
  end loop;
end;
$$;
revoke all on function public.publish_venue_complete(uuid,text,text,text,text,text,text,time,time,integer[],jsonb,jsonb) from public, anon;
grant execute on function public.publish_venue_complete(uuid,text,text,text,text,text,text,time,time,integer[],jsonb,jsonb) to authenticated;
