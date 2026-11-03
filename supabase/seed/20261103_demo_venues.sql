-- Five fictional GOR for prototype testing. Prices and stock are demo values.
-- The existing operator temporarily owns these records; assign each venue to
-- its Mitra account after that account has been created through /operator.
begin;

do $$
declare v_operator uuid;
begin
  select id into v_operator from auth.users where lower(email) = 'palpolpal13@gmail.com';
  if v_operator is null then raise exception 'SmashMate operator account not found'; end if;
  if exists (select 1 from public.venues where name like 'GOR Demo %') then
    raise exception 'Demo venues already exist; seed only once';
  end if;

  insert into public.venues(owner_id,name,description,address,maps_url,open_time,close_time,status)
  values
    (v_operator,'GOR Demo Grogol','GOR fiktif untuk mencoba booking, sewa raket, dan pembelian shuttlecock. Harga dan stok hanya data simulasi.','Area Grogol, Jakarta Barat','https://www.google.com/maps/search/?api=1&query=Grogol+Jakarta+Barat','07:00','23:00','active'),
    (v_operator,'GOR Demo Tangerang','GOR fiktif dengan beberapa pilihan lapangan dan perlengkapan untuk pengujian SmashMate.','Area Karawaci, Kota Tangerang','https://www.google.com/maps/search/?api=1&query=Karawaci+Tangerang','06:00','22:00','active'),
    (v_operator,'GOR Demo Senayan','GOR fiktif untuk mencoba jadwal, harga lapangan, dan katalog perlengkapan berbeda.','Area Senayan, Jakarta Selatan','https://www.google.com/maps/search/?api=1&query=Senayan+Jakarta+Selatan','06:00','23:00','active'),
    (v_operator,'GOR Demo Bekasi','GOR fiktif untuk demonstrasi pemesanan lapangan dan produk dengan stok terbatas.','Area Bekasi Selatan, Kota Bekasi','https://www.google.com/maps/search/?api=1&query=Bekasi+Selatan','07:00','22:00','active'),
    (v_operator,'GOR Demo Depok','GOR fiktif untuk pengujian alur pemain dan katalog Mitra GOR.','Area Beji, Kota Depok','https://www.google.com/maps/search/?api=1&query=Beji+Depok','07:00','22:00','active');
end $$;

insert into public.courts(venue_id,name,price_per_hour)
select v.id,x.court_name,x.price from (values
  ('GOR Demo Grogol','Lapangan 1',75000),('GOR Demo Grogol','Lapangan 2',80000),('GOR Demo Grogol','Lapangan 3',85000),
  ('GOR Demo Tangerang','Lapangan 1',65000),('GOR Demo Tangerang','Lapangan 2',70000),('GOR Demo Tangerang','Lapangan 3',75000),('GOR Demo Tangerang','Lapangan 4',80000),
  ('GOR Demo Senayan','Lapangan 1',100000),('GOR Demo Senayan','Lapangan 2',110000),('GOR Demo Senayan','Lapangan 3',120000),
  ('GOR Demo Bekasi','Lapangan 1',60000),('GOR Demo Bekasi','Lapangan 2',65000),
  ('GOR Demo Depok','Lapangan 1',70000),('GOR Demo Depok','Lapangan 2',75000),('GOR Demo Depok','Lapangan 3',80000)
) as x(venue_name,court_name,price)
join public.venues v on v.name=x.venue_name;

insert into public.venue_products(venue_id,kind,name,description,price,stock)
select v.id,x.kind,x.product_name,x.description,x.price,x.stock from (values
  ('GOR Demo Grogol','racket_rental','Raket Yonex (demo)','Sewa satu raket per sesi booking.',25000,6),
  ('GOR Demo Grogol','racket_rental','Raket Li-Ning (demo)','Sewa satu raket per sesi booking.',20000,4),
  ('GOR Demo Grogol','shuttlecock_sale','Shuttlecock Yonex (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',160000,12),
  ('GOR Demo Grogol','shuttlecock_sale','Shuttlecock Flypower (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',120000,10),
  ('GOR Demo Tangerang','racket_rental','Raket Victor (demo)','Sewa satu raket per sesi booking.',25000,5),
  ('GOR Demo Tangerang','racket_rental','Raket Flypower (demo)','Sewa satu raket per sesi booking.',18000,8),
  ('GOR Demo Tangerang','shuttlecock_sale','Shuttlecock Li-Ning (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',140000,15),
  ('GOR Demo Tangerang','shuttlecock_sale','Shuttlecock Victor (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',165000,8),
  ('GOR Demo Senayan','racket_rental','Raket Yonex (demo)','Sewa satu raket per sesi booking.',35000,4),
  ('GOR Demo Senayan','racket_rental','Raket Victor (demo)','Sewa satu raket per sesi booking.',30000,6),
  ('GOR Demo Senayan','shuttlecock_sale','Shuttlecock Yonex (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',190000,9),
  ('GOR Demo Senayan','shuttlecock_sale','Shuttlecock Li-Ning (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',150000,12),
  ('GOR Demo Bekasi','racket_rental','Raket Flypower (demo)','Sewa satu raket per sesi booking.',15000,10),
  ('GOR Demo Bekasi','racket_rental','Raket Li-Ning (demo)','Sewa satu raket per sesi booking.',22000,6),
  ('GOR Demo Bekasi','shuttlecock_sale','Shuttlecock Flypower (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',110000,20),
  ('GOR Demo Bekasi','shuttlecock_sale','Shuttlecock Victor (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',150000,9),
  ('GOR Demo Depok','racket_rental','Raket Victor (demo)','Sewa satu raket per sesi booking.',25000,5),
  ('GOR Demo Depok','racket_rental','Raket Yonex (demo)','Sewa satu raket per sesi booking.',30000,4),
  ('GOR Demo Depok','shuttlecock_sale','Shuttlecock Li-Ning (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',130000,12),
  ('GOR Demo Depok','shuttlecock_sale','Shuttlecock Yonex (1 slop)','Satu slop berisi 12 shuttlecock dalam data demo.',175000,7)
) as x(venue_name,kind,product_name,description,price,stock)
join public.venues v on v.name=x.venue_name;

commit;
