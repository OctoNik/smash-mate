begin;

alter table public.activities add column duration_minutes integer not null default 120 check (duration_minutes between 30 and 480);
alter table public.activities add column cancelled_at timestamptz;

create table public.sparring_invitations (
 id uuid primary key default gen_random_uuid(),
 challenger_community_id uuid not null references public.communities(id) on delete cascade,
 opponent_community_id uuid not null references public.communities(id) on delete cascade,
 host_id uuid not null references auth.users(id) on delete cascade,
 host_name text not null check(char_length(host_name) between 1 and 60),
 title text not null check(char_length(title) between 5 and 100),
 description text not null default '' check(char_length(description)<=1000),
 location text not null check(char_length(location) between 3 and 160),
 starts_at timestamptz not null,
 duration_minutes integer not null check(duration_minutes between 30 and 480),
 capacity integer not null check(capacity between 2 and 100),
 level text not null check(level in ('all','beginner','intermediate','professional')),
 booking_id uuid references public.court_bookings(id) on delete set null,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 activity_id uuid references public.activities(id) on delete set null,
 created_at timestamptz not null default now(),
 check(challenger_community_id<>opponent_community_id)
);
create index sparring_invitations_challenger_idx on public.sparring_invitations(challenger_community_id,status);
create index sparring_invitations_opponent_idx on public.sparring_invitations(opponent_community_id,status);
alter table public.sparring_invitations enable row level security;
create policy "Managers view sparring invitations" on public.sparring_invitations for select to authenticated using (
 exists(select 1 from public.communities c where c.id in (challenger_community_id,opponent_community_id) and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
create policy "Challenger managers invite sparring" on public.sparring_invitations for insert to authenticated with check (
 host_id=(select auth.uid()) and status='pending' and activity_id is null and starts_at>now() and
 exists(select 1 from public.communities c where c.id=challenger_community_id and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))) and
 (booking_id is null or exists(select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid()) and b.status='confirmed' and b.starts_at=starts_at)));
revoke all on public.sparring_invitations from public,anon,authenticated;
grant select,insert on public.sparring_invitations to authenticated;

create function public.respond_sparring_invitation(p_id uuid,p_accept boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.sparring_invitations%rowtype; v_activity_id uuid;
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 select * into v from public.sparring_invitations where id=p_id for update;
 if not found or v.status<>'pending' or v.starts_at<=now() then raise exception 'Invitation unavailable'; end if;
 if not exists(select 1 from public.communities c where c.id=v.opponent_community_id and (c.owner_id=auth.uid() or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=auth.uid() and m.role='admin'))) then raise exception 'Opponent manager required'; end if;
 if p_accept then
  if v.booking_id is not null and not exists(select 1 from public.court_bookings b where b.id=v.booking_id and b.player_id=v.host_id and b.status='confirmed' and b.starts_at=v.starts_at) then raise exception 'Booking unavailable'; end if;
  insert into public.activities(host_id,host_name,kind,title,description,location,starts_at,duration_minutes,capacity,level,community_id,sparring_opponent_id,booking_id)
   values(v.host_id,v.host_name,'event',v.title,v.description,v.location,v.starts_at,v.duration_minutes,v.capacity,v.level,v.challenger_community_id,v.opponent_community_id,v.booking_id) returning id into v_activity_id;
  update public.sparring_invitations set status='accepted',activity_id=v_activity_id where id=p_id;
  return v_activity_id;
 end if;
 update public.sparring_invitations set status='declined' where id=p_id;
 return null;
end $$;
revoke all on function public.respond_sparring_invitation(uuid,boolean) from public,anon;
grant execute on function public.respond_sparring_invitation(uuid,boolean) to authenticated;

create function public.cancel_sparring_invitation(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.sparring_invitations%rowtype;
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 select * into v from public.sparring_invitations where id=p_id for update;
 if not found or v.status<>'pending' or v.starts_at<=now() or v.host_id<>auth.uid() then raise exception 'Invitation unavailable'; end if;
 update public.sparring_invitations set status='cancelled' where id=p_id;
end $$;
revoke all on function public.cancel_sparring_invitation(uuid) from public,anon;
grant execute on function public.cancel_sparring_invitation(uuid) to authenticated;

create function public.update_sparring_description(p_activity_id uuid,p_description text)
returns void language plpgsql security definer set search_path='' as $$
declare v public.activities%rowtype;
begin
 if auth.uid() is null or char_length(coalesce(p_description,''))>1000 then raise exception 'Invalid description'; end if;
 select * into v from public.activities where id=p_activity_id for update;
 if not found or v.sparring_opponent_id is null or v.cancelled_at is not null or v.starts_at<=now() then raise exception 'Sparring unavailable'; end if;
 if not exists(select 1 from public.communities c where c.id in (v.community_id,v.sparring_opponent_id) and (c.owner_id=auth.uid() or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=auth.uid() and m.role='admin'))) then raise exception 'Community manager required'; end if;
 update public.activities set description=coalesce(p_description,'') where id=p_activity_id;
end $$;
revoke all on function public.update_sparring_description(uuid,text) from public,anon;
grant execute on function public.update_sparring_description(uuid,text) to authenticated;

create or replace function public.join_activity(p_activity_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.activities%rowtype; v_count integer; v_name text;
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 select * into v from public.activities where id=p_activity_id for update;
 if not found or v.cancelled_at is not null or v.starts_at<=now() then raise exception 'Activity unavailable'; end if;
 if v.host_id=auth.uid() then raise exception 'Host already participates'; end if;
 if exists(select 1 from public.activity_participants where activity_id=p_activity_id and user_id=auth.uid()) then raise exception 'Already joined'; end if;
 select count(*) into v_count from public.activity_participants where activity_id=p_activity_id;
 if v_count+1>=v.capacity then raise exception 'Activity is full'; end if;
 select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''),split_part(email,'@',1),'Pemain'),60) into v_name from auth.users where id=auth.uid();
 insert into public.activity_participants(activity_id,user_id,display_name) values(p_activity_id,auth.uid(),coalesce(v_name,'Pemain'));
end $$;

create or replace function public.rate_activity_participant(p_activity_id uuid,p_recipient_id uuid,p_stars integer)
returns void language plpgsql security definer set search_path='' as $$
declare v public.activities%rowtype;
begin
 if auth.uid() is null or p_stars not between 1 and 5 or p_recipient_id=auth.uid() then raise exception 'Invalid rating'; end if;
 select * into v from public.activities where id=p_activity_id;
 if not found or v.cancelled_at is not null or v.starts_at + (v.duration_minutes * interval '1 minute') > now() then raise exception 'Activity not finished'; end if;
 if v.host_id<>auth.uid() and not exists(select 1 from public.activity_participants where activity_id=p_activity_id and user_id=auth.uid()) then raise exception 'Reviewer did not attend'; end if;
 if v.host_id<>p_recipient_id and not exists(select 1 from public.activity_participants where activity_id=p_activity_id and user_id=p_recipient_id) then raise exception 'Recipient did not attend'; end if;
 insert into public.activity_ratings(activity_id,reviewer_id,recipient_id,stars) values(p_activity_id,auth.uid(),p_recipient_id,p_stars);
end $$;

insert into public.activities(host_id,host_name,kind,title,description,location,starts_at,duration_minutes,capacity,level)
select u.id, v.host_name, v.kind, v.title, v.description, v.location, v.starts_at, v.duration_minutes, v.capacity, v.level
from (values
 ('sita.maharani@smashmate.test','Sita Maharani','match','Mabar Ganda Sabtu Pagi','Sesi ganda santai yang sudah selesai.','GOR Senayan, Jakarta','2026-11-01 09:00:00+07'::timestamptz,120,8,'beginner'),
 ('nabila.putri@smashmate.test','Nabila Putri','coaching','Coaching Footwork Dasar','Latihan footwork untuk pemain pemula yang sudah selesai.','GOR Grogol, Jakarta','2026-11-02 16:00:00+07'::timestamptz,90,6,'beginner'),
 ('dion.wijaya@smashmate.test','Dion Wijaya','match','Mabar Intermediate Sore','Sesi permainan bergantian yang sudah selesai.','GOR Tangerang','2026-11-03 18:00:00+07'::timestamptz,120,10,'intermediate')
) as v(email,host_name,kind,title,description,location,starts_at,duration_minutes,capacity,level)
join auth.users u on u.email=v.email
where not exists(select 1 from public.activities a where a.host_id=u.id and a.title=v.title);

commit;
