-- Five fictional GOR for prototype testing. Prices and stock are sample values.
-- The existing operator temporarily owns these records; assign each venue to
-- its Mitra account after that account has been created through /operator.
begin;

do $$
declare v_operator uuid;
begin
  select id into v_operator from auth.users where lower(email) = 'palpolpal13@gmail.com';
  if v_operator is null then raise exception 'SmashMate operator account not found'; end if;
  if exists (select 1 from public.venues where name in (
    'GOR Kencana Grogol', 'Karawaci Badminton Center', 'Senayan Shuttle Arena',
    'Bekasi Racket Hall', 'Depok Smash Court'
  )) then
    raise exception 'Initial venues already exist; seed only once';
  end if;

  insert into public.venues(owner_id,name,description,address,maps_url,open_time,close_time,status)
  values
    (v_operator,'GOR Kencana Grogol','Pilihan lapangan badminton di area Grogol dengan sewa raket dan shuttlecock per slop.','Area Grogol, Jakarta Barat','https://www.google.com/maps/search/?api=1&query=Grogol+Jakarta+Barat','07:00','23:00','active'),
    (v_operator,'Karawaci Badminton Center','Lapangan badminton di area Karawaci dengan beberapa pilihan harga dan perlengkapan.','Area Karawaci, Kota Tangerang','https://www.google.com/maps/search/?api=1&query=Karawaci+Tangerang','06:00','22:00','active'),
    (v_operator,'Senayan Shuttle Arena','Booking lapangan, sewa raket, dan pembelian shuttlecock dalam satu tempat di area Senayan.','Area Senayan, Jakarta Selatan','https://www.google.com/maps/search/?api=1&query=Senayan+Jakarta+Selatan','06:00','23:00','active'),
    (v_operator,'Bekasi Racket Hall','Lapangan badminton di area Bekasi Selatan dengan pilihan raket sewa dan shuttlecock.','Area Bekasi Selatan, Kota Bekasi','https://www.google.com/maps/search/?api=1&query=Bekasi+Selatan','07:00','22:00','active'),
    (v_operator,'Depok Smash Court','Pilihan lapangan dan perlengkapan badminton di area Beji, Depok.','Area Beji, Kota Depok','https://www.google.com/maps/search/?api=1&query=Beji+Depok','07:00','22:00','active');
end $$;

insert into public.courts(venue_id,name,price_per_hour)
select v.id,x.court_name,x.price from (values
  ('GOR Kencana Grogol','Lapangan 1',75000),('GOR Kencana Grogol','Lapangan 2',80000),('GOR Kencana Grogol','Lapangan 3',85000),
  ('Karawaci Badminton Center','Lapangan 1',65000),('Karawaci Badminton Center','Lapangan 2',70000),('Karawaci Badminton Center','Lapangan 3',75000),('Karawaci Badminton Center','Lapangan 4',80000),
  ('Senayan Shuttle Arena','Lapangan 1',100000),('Senayan Shuttle Arena','Lapangan 2',110000),('Senayan Shuttle Arena','Lapangan 3',120000),
  ('Bekasi Racket Hall','Lapangan 1',60000),('Bekasi Racket Hall','Lapangan 2',65000),
  ('Depok Smash Court','Lapangan 1',70000),('Depok Smash Court','Lapangan 2',75000),('Depok Smash Court','Lapangan 3',80000)
) as x(venue_name,court_name,price)
join public.venues v on v.name=x.venue_name;

insert into public.venue_products(venue_id,kind,name,description,price,stock)
select v.id,x.kind,x.product_name,x.description,x.price,x.stock from (values
  ('GOR Kencana Grogol','racket_rental','Raket Yonex','Sewa satu raket per sesi booking.',25000,6),
  ('GOR Kencana Grogol','racket_rental','Raket Li-Ning','Sewa satu raket per sesi booking.',20000,4),
  ('GOR Kencana Grogol','shuttlecock_sale','Shuttlecock Yonex (1 slop)','Satu slop berisi 12 shuttlecock.',160000,12),
  ('GOR Kencana Grogol','shuttlecock_sale','Shuttlecock Flypower (1 slop)','Satu slop berisi 12 shuttlecock.',120000,10),
  ('Karawaci Badminton Center','racket_rental','Raket Victor','Sewa satu raket per sesi booking.',25000,5),
  ('Karawaci Badminton Center','racket_rental','Raket Flypower','Sewa satu raket per sesi booking.',18000,8),
  ('Karawaci Badminton Center','shuttlecock_sale','Shuttlecock Li-Ning (1 slop)','Satu slop berisi 12 shuttlecock.',140000,15),
  ('Karawaci Badminton Center','shuttlecock_sale','Shuttlecock Victor (1 slop)','Satu slop berisi 12 shuttlecock.',165000,8),
  ('Senayan Shuttle Arena','racket_rental','Raket Yonex','Sewa satu raket per sesi booking.',35000,4),
  ('Senayan Shuttle Arena','racket_rental','Raket Victor','Sewa satu raket per sesi booking.',30000,6),
  ('Senayan Shuttle Arena','shuttlecock_sale','Shuttlecock Yonex (1 slop)','Satu slop berisi 12 shuttlecock.',190000,9),
  ('Senayan Shuttle Arena','shuttlecock_sale','Shuttlecock Li-Ning (1 slop)','Satu slop berisi 12 shuttlecock.',150000,12),
  ('Bekasi Racket Hall','racket_rental','Raket Flypower','Sewa satu raket per sesi booking.',15000,10),
  ('Bekasi Racket Hall','racket_rental','Raket Li-Ning','Sewa satu raket per sesi booking.',22000,6),
  ('Bekasi Racket Hall','shuttlecock_sale','Shuttlecock Flypower (1 slop)','Satu slop berisi 12 shuttlecock.',110000,20),
  ('Bekasi Racket Hall','shuttlecock_sale','Shuttlecock Victor (1 slop)','Satu slop berisi 12 shuttlecock.',150000,9),
  ('Depok Smash Court','racket_rental','Raket Victor','Sewa satu raket per sesi booking.',25000,5),
  ('Depok Smash Court','racket_rental','Raket Yonex','Sewa satu raket per sesi booking.',30000,4),
  ('Depok Smash Court','shuttlecock_sale','Shuttlecock Li-Ning (1 slop)','Satu slop berisi 12 shuttlecock.',130000,12),
  ('Depok Smash Court','shuttlecock_sale','Shuttlecock Yonex (1 slop)','Satu slop berisi 12 shuttlecock.',175000,7)
) as x(venue_name,kind,product_name,description,price,stock)
join public.venues v on v.name=x.venue_name;

commit;
