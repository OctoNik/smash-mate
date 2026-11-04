begin;
alter table public.communities add column avatar_path text, add column banner_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-identity','community-identity',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Community owners read identity media" on storage.objects for select to authenticated
using(bucket_id='community-identity' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community owners upload identity media" on storage.objects for insert to authenticated
with check(bucket_id='community-identity' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community owners remove identity media" on storage.objects for delete to authenticated
using(bucket_id='community-identity' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and c.owner_id=(select auth.uid())));
commit;
