begin;

alter table public.communities add column owner_name text not null default 'Pendiri komunitas';
update public.communities c set owner_name=left(coalesce(nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1),'Pendiri komunitas'),60)
from auth.users u where u.id=c.owner_id;
alter table public.communities add constraint communities_owner_name_length check (char_length(owner_name) between 1 and 60);

alter table public.community_members add column display_name text not null default 'Pemain';
update public.community_members m set display_name=left(coalesce(nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1),'Pemain'),60)
from auth.users u where u.id=m.user_id;
alter table public.community_members add constraint community_members_name_length check (char_length(display_name) between 1 and 60);

create table public.community_photos (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  image_path text not null unique,
  created_at timestamptz not null default now()
);
create index community_photos_community_idx on public.community_photos(community_id,created_at);
alter table public.community_photos enable row level security;
create policy "Players view community photos" on public.community_photos for select to authenticated using (true);
create policy "Owners add community photos" on public.community_photos for insert to authenticated
  with check (exists(select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())));
create policy "Owners remove community photos" on public.community_photos for delete to authenticated
  using (exists(select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())));
revoke all on public.community_photos from public,anon,authenticated;
grant select,insert,delete on public.community_photos to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-media','community-media',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Community owners read media" on storage.objects for select to authenticated
  using(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community owners upload media" on storage.objects for insert to authenticated
  with check(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and c.owner_id=(select auth.uid())));
create policy "Community owners remove media" on storage.objects for delete to authenticated
  using(bucket_id='community-media' and exists(select 1 from public.communities c where c.id::text=split_part(name,'/',1) and c.owner_id=(select auth.uid())));

drop table public.feedback;
drop table public.coach_profiles;

commit;
