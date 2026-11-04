begin;
drop policy "Owners remove community photos" on public.community_photos;
create policy "Community managers remove photos" on public.community_photos for delete to authenticated using
(exists(select 1 from public.communities c where c.id=community_id and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
drop policy "Community owners remove media" on storage.objects;
create policy "Community managers remove media" on storage.objects for delete to authenticated using
(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and (c.owner_id=(select auth.uid()) or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=(select auth.uid()) and m.role='admin'))));
commit;
