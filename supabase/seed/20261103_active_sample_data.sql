-- Prototype activity data. Run once after the ten named player accounts exist.
-- Passwords are not stored in this file.
begin;

do $$
declare
  item record;
  v_host uuid;
  v_joiner uuid;
  v_venue uuid;
  v_court uuid;
  v_racket uuid;
  v_shuttle uuid;
  v_booking uuid;
  v_community uuid;
  v_activity uuid;
  v_start timestamptz;
begin
  if (select count(*) from auth.users
      where email like '%@smashmate.test'
        and raw_app_meta_data->>'smashmate_role' = 'player') <> 10 then
    raise exception 'Create all ten named sample player accounts first';
  end if;
  if exists (select 1 from public.communities where name in
      ('Grogol Shuttle Club','Karawaci Badminton Circle','Depok Rally Squad'))
    or exists (select 1 from public.activities where title = 'Mabar Ganda Grogol Sore') then
    raise exception 'Sample activity data already exists; seed only once';
  end if;

  insert into public.coach_profiles(user_id,display_name,bio,city)
  select u.id,x.display_name,x.bio,x.city from (values
    ('dion.wijaya@smashmate.test','Dion Wijaya','Fokus latihan teknik dasar, footwork, dan servis untuk pemain pemula.','Jakarta Selatan'),
    ('sita.maharani@smashmate.test','Sita Maharani','Latihan konsistensi reli, penempatan bola, dan pola permainan ganda.','Depok')
  ) as x(email,display_name,bio,city) join auth.users u on u.email=x.email;

  insert into public.communities(owner_id,name,description,city)
  select u.id,x.name,x.description,x.city from (values
    ('arya.pratama@smashmate.test','Grogol Shuttle Club','Mabar rutin untuk pemain yang ingin menambah jam terbang.','Jakarta Barat'),
    ('nabila.putri@smashmate.test','Karawaci Badminton Circle','Komunitas latihan dan turnamen kecil di Karawaci.','Tangerang'),
    ('sita.maharani@smashmate.test','Depok Rally Squad','Bermain dan berlatih bersama dari beginner hingga intermediate.','Depok')
  ) as x(email,name,description,city) join auth.users u on u.email=x.email;

  insert into public.community_members(community_id,user_id)
  select c.id,u.id from (values
    ('Grogol Shuttle Club','arya.pratama@smashmate.test'),
    ('Grogol Shuttle Club','fajar.ramadhan@smashmate.test'),
    ('Grogol Shuttle Club','rina.anggraini@smashmate.test'),
    ('Grogol Shuttle Club','kevin.halim@smashmate.test'),
    ('Grogol Shuttle Club','tiara.safitri@smashmate.test'),
    ('Grogol Shuttle Club','bagas.saputra@smashmate.test'),
    ('Karawaci Badminton Circle','nabila.putri@smashmate.test'),
    ('Karawaci Badminton Circle','arya.pratama@smashmate.test'),
    ('Karawaci Badminton Circle','dion.wijaya@smashmate.test'),
    ('Karawaci Badminton Circle','sita.maharani@smashmate.test'),
    ('Karawaci Badminton Circle','yoga.nugraha@smashmate.test'),
    ('Karawaci Badminton Circle','kevin.halim@smashmate.test'),
    ('Karawaci Badminton Circle','rina.anggraini@smashmate.test'),
    ('Depok Rally Squad','sita.maharani@smashmate.test'),
    ('Depok Rally Squad','nabila.putri@smashmate.test'),
    ('Depok Rally Squad','fajar.ramadhan@smashmate.test'),
    ('Depok Rally Squad','tiara.safitri@smashmate.test'),
    ('Depok Rally Squad','bagas.saputra@smashmate.test')
  ) as x(community_name,email)
  join public.communities c on c.name=x.community_name
  join auth.users u on u.email=x.email;

  for item in select * from (values
    ('arya.pratama@smashmate.test','GOR Kencana Grogol','Lapangan 1','Raket Yonex',2,'Shuttlecock Yonex (1 slop)',1,3,19,'match','Mabar Ganda Grogol Sore','Rotasi ganda, semua peserta mendapat giliran bermain.',8,'intermediate','Grogol Shuttle Club'),
    ('nabila.putri@smashmate.test','Karawaci Badminton Center','Lapangan 1','Raket Flypower',4,'Shuttlecock Li-Ning (1 slop)',2,5,18,'event','Mini Turnamen Ganda Karawaci','Lomba ganda komunitas dengan pembagian pasangan di lokasi.',12,'all','Karawaci Badminton Circle'),
    ('dion.wijaya@smashmate.test','Senayan Shuttle Arena','Lapangan 2','Raket Victor',2,'Shuttlecock Yonex (1 slop)',1,7,9,'coaching','Latihan Footwork Bersama Dion','Latihan gerak kaki dan servis untuk pemain beginner.',6,'beginner',null),
    ('sita.maharani@smashmate.test','Depok Smash Court','Lapangan 1','Raket Yonex',2,'Shuttlecock Li-Ning (1 slop)',1,9,16,'coaching','Latihan Pola Ganda Depok','Latihan rotasi posisi dan penempatan bola.',6,'intermediate','Depok Rally Squad'),
    ('fajar.ramadhan@smashmate.test','Bekasi Racket Hall','Lapangan 2','Raket Flypower',3,'Shuttlecock Flypower (1 slop)',1,11,8,'match','Mabar Beginner Bekasi Pagi','Bermain santai dengan aturan dasar untuk pemain baru.',4,'beginner',null),
    ('kevin.halim@smashmate.test','GOR Kencana Grogol','Lapangan 2','Raket Li-Ning',1,'Shuttlecock Flypower (1 slop)',1,13,19,'match','Sparring Ganda Grogol','Sesi ganda bergantian untuk level intermediate.',6,'intermediate',null),
    ('yoga.nugraha@smashmate.test','Senayan Shuttle Arena','Lapangan 1',null,0,'Shuttlecock Li-Ning (1 slop)',2,15,10,'event','Lomba Ganda Senayan','Pertandingan ganda skala kecil dengan sistem gugur.',8,'professional',null),
    ('nabila.putri@smashmate.test','Karawaci Badminton Center','Lapangan 3','Raket Victor',2,'Shuttlecock Victor (1 slop)',1,17,9,'match','Fun Match Karawaci Akhir Pekan','Mabar terbuka dengan pasangan berganti setiap game.',8,'all','Karawaci Badminton Circle')
  ) as x(host_email,venue_name,court_name,racket_name,racket_quantity,shuttle_name,shuttle_quantity,day_offset,start_hour,kind,title,description,capacity,level,community_name)
  loop
    select id into strict v_host from auth.users where email=item.host_email;
    select id into strict v_venue from public.venues where name=item.venue_name and status='active';
    select id into strict v_court from public.courts where venue_id=v_venue and name=item.court_name and is_active;
    v_racket := null;
    if item.racket_name is not null then
      select id into strict v_racket from public.venue_products
        where venue_id=v_venue and kind='racket_rental' and name=item.racket_name and is_active;
    end if;
    select id into strict v_shuttle from public.venue_products
      where venue_id=v_venue and kind='shuttlecock_sale' and name=item.shuttle_name and is_active;
    v_community := null;
    if item.community_name is not null then
      select id into strict v_community from public.communities
        where name=item.community_name and owner_id=v_host;
    end if;
    v_start := ((now() at time zone 'Asia/Jakarta')::date +
      make_interval(days=>item.day_offset,hours=>item.start_hour)) at time zone 'Asia/Jakarta';
    perform set_config('request.jwt.claim.sub',v_host::text,true);
    v_booking := public.book_court(v_court,v_start,120,v_racket,item.racket_quantity,v_shuttle,item.shuttle_quantity);
    perform public.demo_pay_booking(v_booking);
    insert into public.activities(host_id,host_name,kind,title,description,location,starts_at,capacity,level,booking_id,community_id)
    values (v_host,(select left(raw_user_meta_data->>'full_name',60) from auth.users where id=v_host),
      item.kind,item.title,item.description,item.venue_name || ' · ' || item.court_name,
      v_start,item.capacity,item.level,v_booking,v_community);
  end loop;

  for item in select * from (values
    ('Mabar Ganda Grogol Sore','fajar.ramadhan@smashmate.test'),
    ('Mabar Ganda Grogol Sore','rina.anggraini@smashmate.test'),
    ('Mabar Ganda Grogol Sore','kevin.halim@smashmate.test'),
    ('Mabar Ganda Grogol Sore','bagas.saputra@smashmate.test'),
    ('Mabar Ganda Grogol Sore','tiara.safitri@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','arya.pratama@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','fajar.ramadhan@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','kevin.halim@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','rina.anggraini@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','bagas.saputra@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','tiara.safitri@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','yoga.nugraha@smashmate.test'),
    ('Mini Turnamen Ganda Karawaci','sita.maharani@smashmate.test'),
    ('Latihan Footwork Bersama Dion','fajar.ramadhan@smashmate.test'),
    ('Latihan Footwork Bersama Dion','rina.anggraini@smashmate.test'),
    ('Latihan Footwork Bersama Dion','tiara.safitri@smashmate.test'),
    ('Latihan Footwork Bersama Dion','bagas.saputra@smashmate.test'),
    ('Latihan Pola Ganda Depok','arya.pratama@smashmate.test'),
    ('Latihan Pola Ganda Depok','nabila.putri@smashmate.test'),
    ('Latihan Pola Ganda Depok','kevin.halim@smashmate.test'),
    ('Latihan Pola Ganda Depok','yoga.nugraha@smashmate.test'),
    ('Mabar Beginner Bekasi Pagi','arya.pratama@smashmate.test'),
    ('Mabar Beginner Bekasi Pagi','rina.anggraini@smashmate.test'),
    ('Mabar Beginner Bekasi Pagi','tiara.safitri@smashmate.test'),
    ('Sparring Ganda Grogol','arya.pratama@smashmate.test'),
    ('Sparring Ganda Grogol','nabila.putri@smashmate.test'),
    ('Sparring Ganda Grogol','bagas.saputra@smashmate.test'),
    ('Sparring Ganda Grogol','yoga.nugraha@smashmate.test'),
    ('Lomba Ganda Senayan','dion.wijaya@smashmate.test'),
    ('Lomba Ganda Senayan','sita.maharani@smashmate.test'),
    ('Lomba Ganda Senayan','arya.pratama@smashmate.test'),
    ('Lomba Ganda Senayan','nabila.putri@smashmate.test'),
    ('Lomba Ganda Senayan','kevin.halim@smashmate.test'),
    ('Lomba Ganda Senayan','bagas.saputra@smashmate.test'),
    ('Fun Match Karawaci Akhir Pekan','fajar.ramadhan@smashmate.test'),
    ('Fun Match Karawaci Akhir Pekan','rina.anggraini@smashmate.test'),
    ('Fun Match Karawaci Akhir Pekan','tiara.safitri@smashmate.test'),
    ('Fun Match Karawaci Akhir Pekan','bagas.saputra@smashmate.test'),
    ('Fun Match Karawaci Akhir Pekan','kevin.halim@smashmate.test')
  ) as x(activity_title,email)
  loop
    select id into strict v_joiner from auth.users where email=item.email;
    select id into strict v_activity from public.activities where title=item.activity_title;
    perform set_config('request.jwt.claim.sub',v_joiner::text,true);
    perform public.join_activity(v_activity);
  end loop;
end $$;

commit;
