-- Run against the demo project via SQL Editor/MCP. All fixtures and writes roll back.
-- Uses existing demo identities but never reads passwords or modifies their metadata.
begin;
create temp table qa_results(name text, status text, detail text);
create temp table qa_context(key text primary key,value text);
grant all on qa_results,qa_context to authenticated,anon;
insert into qa_context values
('player',(select id::text from auth.users where email='arya.pratama@smashmate.test')),
('other',(select id::text from auth.users where email='dion.wijaya@smashmate.test')),
('third',(select id::text from auth.users where email='nabila.putri@smashmate.test')),
('partner',(select id::text from auth.users where email='mitra.senayan@smashmate-demo.test')),
('operator',(select id::text from auth.users where email='palpolpal13@gmail.com')),
('venue',gen_random_uuid()::text),('court',gen_random_uuid()::text),
('racket',gen_random_uuid()::text),('shuttle',gen_random_uuid()::text),
('activity',gen_random_uuid()::text),('finished',gen_random_uuid()::text),('ongoing',gen_random_uuid()::text),
('community',gen_random_uuid()::text),('opponent',gen_random_uuid()::text),
('linked',gen_random_uuid()::text),('invite',gen_random_uuid()::text),
('date',((now() at time zone 'Asia/Jakarta')::date+20)::text);
create function pg_temp.id(k text) returns uuid language sql as $$select value::uuid from qa_context where key=k$$;
create function pg_temp.login(k text, r text default 'player') returns void language plpgsql as $$begin
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id(k),'role','authenticated','app_metadata',jsonb_build_object('smashmate_role',r))::text,true);
end$$;
create function pg_temp.check_test(n text,q text,mode text default 'true') returns void language plpgsql as $$
declare result boolean; msg text;
begin
  begin
    if mode='reject' then
      execute q;
      raise exception using errcode='ZX001',message='Expected rejection but statement succeeded';
    elsif mode='run' then
      execute q; insert into qa_results values(n,'PASS','');
    else
      execute q into result;
      insert into qa_results values(n,case when result is true then 'PASS' else 'FAIL' end,'');
    end if;
  exception when others then
    get stacked diagnostics msg=message_text;
    insert into qa_results values(n,case when mode='reject' and sqlstate<>'ZX001' then 'PASS' else 'FAIL' end,sqlstate||': '||msg);
  end;
end$$;
insert into public.venues(id,owner_id,name,address,status,open_time,close_time)
values(pg_temp.id('venue'),pg_temp.id('partner'),'QA rollback GOR','QA Jakarta venue','active','06:00','23:00');
insert into public.courts(id,venue_id,name,price_per_hour) values(pg_temp.id('court'),pg_temp.id('venue'),'QA Court',100000);
insert into public.court_bookings(id,court_id,venue_id,player_id,player_name,starts_at,ends_at,court_price,total_amount,status)
values(pg_temp.id('ongoing'),pg_temp.id('court'),pg_temp.id('venue'),pg_temp.id('player'),'QA Arya',now()-interval '30 minutes',now()+interval '30 minutes',100000,100000,'confirmed');
insert into public.venue_products(id,venue_id,kind,name,price,stock) values
(pg_temp.id('racket'),pg_temp.id('venue'),'racket_rental','QA Racket',20000,2),
(pg_temp.id('shuttle'),pg_temp.id('venue'),'shuttlecock_sale','QA Shuttle',100000,5);
insert into public.activities(id,host_id,host_name,kind,title,location,starts_at,capacity,duration_minutes,level) values
(pg_temp.id('activity'),pg_temp.id('player'),'QA Arya','match','QA future activity','QA venue',now()+interval '10 days',3,60,'all'),
(pg_temp.id('finished'),pg_temp.id('player'),'QA Arya','match','QA finished activity','QA venue',now()-interval '2 days',3,60,'all');
insert into public.activity_participants(activity_id,user_id,display_name) values(pg_temp.id('finished'),pg_temp.id('other'),'QA Dion');
insert into public.communities(id,owner_id,owner_name,name) values
(pg_temp.id('community'),pg_temp.id('player'),'QA Arya','QA Challenger'),
(pg_temp.id('opponent'),pg_temp.id('other'),'QA Dion','QA Opponent');

set local role anon;
select pg_temp.check_test('guest cannot read private ratings','select count(*)=0 from public.activity_ratings');
select pg_temp.check_test('guest cannot join activity','select public.join_activity(pg_temp.id(''activity''))','reject');
set local role authenticated;
select pg_temp.login('player');
select pg_temp.check_test('player sees active GOR','select exists(select 1 from public.venues where id=pg_temp.id(''venue''))');
select pg_temp.check_test('ongoing booking remains in occupied slots','select exists(select 1 from public.venue_busy_slots(pg_temp.id(''venue'')) where starts_at<now() and ends_at>now())');
select pg_temp.check_test('host cannot join own activity','select public.join_activity(pg_temp.id(''activity''))','reject');
select pg_temp.login('other');
select pg_temp.check_test('participant joins activity','select public.join_activity(pg_temp.id(''activity''))','run');
select pg_temp.check_test('duplicate join denied','select public.join_activity(pg_temp.id(''activity''))','reject');
select pg_temp.login('third');
select pg_temp.check_test('last available slot can join','select public.join_activity(pg_temp.id(''activity''))','run');
select pg_temp.login('player');
select pg_temp.check_test('capacity counts host','select count(*)=2 from public.activity_participants where activity_id=pg_temp.id(''activity'')');
select pg_temp.check_test('capacity cannot fall below attendance','update public.activities set capacity=2 where id=pg_temp.id(''activity'')','reject');
select pg_temp.login('other');
select pg_temp.check_test('participant can leave','with removed as (delete from public.activity_participants where activity_id=pg_temp.id(''activity'') and user_id=auth.uid() returning *) select count(*)=1 from removed');
select pg_temp.check_test('other cannot edit host activity','with changed as(update public.activities set title=''QA unauthorized change'' where id=pg_temp.id(''activity'') returning id) select count(*)=0 from changed');

select pg_temp.check_test('finished participant can rate host','select public.rate_activity_participant(pg_temp.id(''finished''),pg_temp.id(''player''),4)','run');
select pg_temp.check_test('duplicate rating denied','select public.rate_activity_participant(pg_temp.id(''finished''),pg_temp.id(''player''),4)','reject');
select pg_temp.check_test('self rating denied','select public.rate_activity_participant(pg_temp.id(''finished''),auth.uid(),5)','reject');
select pg_temp.check_test('invalid stars denied','select public.rate_activity_participant(pg_temp.id(''finished''),pg_temp.id(''player''),0)','reject');
select pg_temp.check_test('future rating denied','select public.rate_activity_participant(pg_temp.id(''activity''),pg_temp.id(''player''),5)','reject');
select pg_temp.login('third');
select pg_temp.check_test('nonparticipant rating denied','select public.rate_activity_participant(pg_temp.id(''finished''),pg_temp.id(''player''),5)','reject');
select pg_temp.check_test('unrelated user cannot read rating','select count(*)=0 from public.activity_ratings where activity_id=pg_temp.id(''finished'')');
select pg_temp.login('player');
select pg_temp.check_test('recipient can read own rating','select count(*)=1 from public.activity_ratings where activity_id=pg_temp.id(''finished'')');

select pg_temp.login('other');
select pg_temp.check_test('cannot self assign community admin','insert into public.community_members(community_id,user_id,role) values(pg_temp.id(''community''),auth.uid(),''admin'')','reject');
select pg_temp.check_test('join community as member','insert into public.community_members(community_id,user_id) values(pg_temp.id(''community''),auth.uid())','run');
select pg_temp.check_test('member cannot promote self','with changed as(update public.community_members set role=''admin'' where community_id=pg_temp.id(''community'') and user_id=auth.uid() returning *) select count(*)=0 from changed');
select pg_temp.login('player');
select pg_temp.check_test('owner appoints admin','with changed as(update public.community_members set role=''admin'' where community_id=pg_temp.id(''community'') and user_id=pg_temp.id(''other'') returning *) select count(*)=1 from changed');
select pg_temp.login('other');
select pg_temp.check_test('admin adds gallery photo','insert into public.community_photos(community_id,image_path) values(pg_temp.id(''community''),''qa-rollback-photo.png'')','run');
select pg_temp.check_test('admin cannot change community identity','with changed as(update public.communities set name=''QA unauthorized identity'' where id=pg_temp.id(''community'') returning *) select count(*)=0 from changed');

select pg_temp.login('player');
select pg_temp.check_test('excess racket stock denied',format('select public.book_court_with_items(%L,(%L||'' 09:00+07'')::timestamptz,120,%L::jsonb)',pg_temp.id('court'),(select value from qa_context where key='date'),jsonb_build_array(jsonb_build_object('product_id',pg_temp.id('racket'),'quantity',3))),'reject');
select pg_temp.check_test('invalid duration denied',format('select public.book_court_with_items(%L,(%L||'' 09:00+07'')::timestamptz,30,''[]''::jsonb)',pg_temp.id('court'),(select value from qa_context where key='date')),'reject');
select pg_temp.check_test('booking with multiple products','insert into qa_context select ''booking'',public.book_court_with_items(pg_temp.id(''court''),((select value from qa_context where key=''date'')||'' 09:00+07'')::timestamptz,120,jsonb_build_array(jsonb_build_object(''product_id'',pg_temp.id(''racket''),''quantity'',2),jsonb_build_object(''product_id'',pg_temp.id(''shuttle''),''quantity'',1)))::text','run');
select pg_temp.check_test('booking total calculated by server','select total_amount=340000 from public.court_bookings where id=pg_temp.id(''booking'')');
select pg_temp.check_test('shuttle stock deducted','select stock=4 from public.venue_products where id=pg_temp.id(''shuttle'')');
select pg_temp.check_test('overlap rejected',format('select public.book_court_with_items(%L,(%L||'' 10:00+07'')::timestamptz,60,''[]''::jsonb)',pg_temp.id('court'),(select value from qa_context where key='date')),'reject');
select pg_temp.check_test('occupied slot exposed','select exists(select 1 from public.venue_busy_slots(pg_temp.id(''venue'')) where court_id=pg_temp.id(''court''))');
select pg_temp.login('other');
select pg_temp.check_test('other player cannot view booking','select count(*)=0 from public.court_bookings where id=pg_temp.id(''booking'')');
select pg_temp.check_test('other player cannot pay','select public.demo_pay_booking(pg_temp.id(''booking''))','reject');
select pg_temp.check_test('other player cannot cancel','select public.cancel_court_booking(pg_temp.id(''booking''))','reject');
select pg_temp.login('player');
select pg_temp.check_test('checkout simulation confirms','select public.demo_pay_booking(pg_temp.id(''booking''))','run');
select pg_temp.check_test('confirmed status saved','select status=''confirmed'' from public.court_bookings where id=pg_temp.id(''booking'')');
select pg_temp.check_test('mismatched booking schedule rejected','insert into public.activities(host_id,host_name,kind,title,location,starts_at,duration_minutes,capacity,level,booking_id) select auth.uid(),''QA Arya'',''match'',''QA forged booking time'',''QA venue'',starts_at+interval ''1 hour'',120,4,''all'',id from public.court_bookings where id=pg_temp.id(''booking'')','reject');
select pg_temp.check_test('activity linked to confirmed booking','insert into public.activities(id,host_id,host_name,kind,title,location,starts_at,duration_minutes,capacity,level,booking_id) select pg_temp.id(''linked''),auth.uid(),''QA Arya'',''match'',''QA linked booking'',''QA venue'',starts_at,120,4,''all'',id from public.court_bookings where id=pg_temp.id(''booking'')','run');
select pg_temp.check_test('active activity prevents cancellation','select public.cancel_court_booking(pg_temp.id(''booking''))','reject');
select pg_temp.check_test('host soft cancels activity','update public.activities set cancelled_at=now() where id=pg_temp.id(''linked'')','run');
select pg_temp.check_test('cancel booking after activity cancelled','select public.cancel_court_booking(pg_temp.id(''booking''))','run');
select pg_temp.check_test('shuttle stock restored','select stock=5 from public.venue_products where id=pg_temp.id(''shuttle'')');
select pg_temp.check_test('cancelled activity history retained','select cancelled_at is not null from public.activities where id=pg_temp.id(''linked'')');
select pg_temp.check_test('double cancellation denied','select public.cancel_court_booking(pg_temp.id(''booking''))','reject');

select pg_temp.login('partner','partner');
select pg_temp.check_test('partner cannot join player activities','select public.join_activity(pg_temp.id(''activity''))','reject');
select pg_temp.check_test('partner views own bookings','select count(*)=1 from public.court_bookings where id=pg_temp.id(''booking'')');
select pg_temp.check_test('partner edits own court','with changed as(update public.courts set price_per_hour=110000 where id=pg_temp.id(''court'') returning *) select count(*)=1 from changed');
select pg_temp.check_test('partner edits own product','with changed as(update public.venue_products set stock=6 where id=pg_temp.id(''shuttle'') returning *) select count(*)=1 from changed');
select pg_temp.check_test('partner adds closure','insert into public.venue_closures(venue_id,starts_on,ends_on) values(pg_temp.id(''venue''),(select value::date from qa_context where key=''date''),(select value::date from qa_context where key=''date''))','run');
select pg_temp.check_test('partner cannot book as player',format('select public.book_court_with_items(%L,(%L||'' 09:00+07'')::timestamptz,60,''[]''::jsonb)',pg_temp.id('court'),(select value from qa_context where key='date')),'reject');
select pg_temp.login('player');
select pg_temp.check_test('closed date cannot be booked',format('select public.book_court_with_items(%L,(%L||'' 09:00+07'')::timestamptz,60,''[]''::jsonb)',pg_temp.id('court'),(select value from qa_context where key='date')),'reject');
select pg_temp.check_test('player cannot edit venue products','with changed as(update public.venue_products set stock=999 where id=pg_temp.id(''shuttle'') returning *) select count(*)=0 from changed');

select pg_temp.check_test('send sparring invitation','insert into public.sparring_invitations(id,challenger_community_id,opponent_community_id,host_id,host_name,title,location,starts_at,duration_minutes,capacity,level) values(pg_temp.id(''invite''),pg_temp.id(''community''),pg_temp.id(''opponent''),auth.uid(),''QA Arya'',''QA sparring invite'',''QA venue'',now()+interval ''12 days'',60,8,''all'')','run');
select pg_temp.check_test('sender cannot accept own challenge','select public.respond_sparring_invitation(pg_temp.id(''invite''),true)','reject');
select pg_temp.login('other');
select pg_temp.check_test('opponent accepts sparring','insert into qa_context select ''sparring'',public.respond_sparring_invitation(pg_temp.id(''invite''),true)::text','run');
select pg_temp.check_test('accepted invite creates activity','select exists(select 1 from public.activities where id=pg_temp.id(''sparring'') and sparring_opponent_id=pg_temp.id(''opponent''))');
select pg_temp.check_test('cannot accept invitation twice','select public.respond_sparring_invitation(pg_temp.id(''invite''),true)','reject');
select pg_temp.check_test('opponent manager edits sparring description','select public.update_sparring_description(pg_temp.id(''sparring''),''QA updated description'')','run');
select pg_temp.login('third');
select pg_temp.check_test('outsider cannot edit sparring','select public.update_sparring_description(pg_temp.id(''sparring''),''QA invalid edit'')','reject');

reset role;
select name,status,detail from qa_results order by status,name;
rollback;
