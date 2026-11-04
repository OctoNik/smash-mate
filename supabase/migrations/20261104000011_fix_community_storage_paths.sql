begin;
drop policy "Community owners read identity media" on storage.objects;
drop policy "Community owners upload identity media" on storage.objects;
drop policy "Community owners remove identity media" on storage.objects;
create policy "Community owners read identity media" on storage.objects for select to authenticated
using(bucket_id='community-identity' and exists(select 1 from public.communities c where c.id::text=split_part(storage.objects.name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community owners upload identity media" on storage.objects for insert to authenticated
with check(bucket_id='community-identity' and exists(select 1 from public.communities c where c.id::text=split_part(storage.objects.name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community owners remove identity media" on storage.objects for delete to authenticated
using(bucket_id='community-identity' and exists(select 1 from public.communities c where c.id::text=split_part(storage.objects.name,'/',1) and c.owner_id=(select auth.uid())));

drop policy "Community owners read media" on storage.objects;
drop policy "Community managers upload media" on storage.objects;
drop policy "Community managers remove media" on storage.objects;
create policy "Community owners read media" on storage.objects for select to authenticated
using(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(storage.objects.name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community managers upload media" on storage.objects for insert to authenticated
with check(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(storage.objects.name,'/',1) and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
create policy "Community managers remove media" on storage.objects for delete to authenticated
using(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(storage.objects.name,'/',1) and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
commit;
