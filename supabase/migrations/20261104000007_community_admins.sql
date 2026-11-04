begin;
alter table public.community_members add column role text not null default 'member' check (role in ('member','admin'));
create policy "Owner assigns community admins" on public.community_members for update to authenticated
using (exists(select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())))
with check (exists(select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())));
grant update(role) on public.community_members to authenticated;
alter policy "Players leave communities" on public.community_members using (user_id=(select auth.uid()) and not exists(select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())));

alter policy "Users create their own activities" on public.activities with check (
 host_id=(select auth.uid()) and starts_at>now() and
 (booking_id is null or exists(select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid()) and b.status='confirmed' and b.starts_at=starts_at)) and
 (community_id is null or exists(select 1 from public.communities c where c.id=community_id and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin')))));
alter policy "Hosts can update future activities" on public.activities with check (
 host_id=(select auth.uid()) and starts_at>now() and
 (booking_id is null or exists(select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid()) and b.status='confirmed' and b.starts_at=starts_at)) and
 (community_id is null or exists(select 1 from public.communities c where c.id=community_id and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin')))));

drop policy "Owners add community photos" on public.community_photos;
create policy "Community managers add photos" on public.community_photos for insert to authenticated with check
(exists(select 1 from public.communities c where c.id=community_id and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
drop policy "Community owners upload media" on storage.objects;
create policy "Community managers upload media" on storage.objects for insert to authenticated with check
(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
commit;
