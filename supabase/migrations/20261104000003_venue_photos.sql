begin;

create table public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  image_path text not null unique,
  created_at timestamptz not null default now(),
  constraint venue_photos_path_check check (image_path like venue_id::text || '/venues/%')
);
create index venue_photos_venue_idx on public.venue_photos(venue_id, created_at);
alter table public.venue_photos enable row level security;
create policy "Members view venue photos" on public.venue_photos
  for select to authenticated using (exists (
    select 1 from public.venues v where v.id = venue_id
      and (v.status = 'active' or v.owner_id = (select auth.uid()))
  ));
create policy "Owners add venue photos" on public.venue_photos
  for insert to authenticated with check (exists (
    select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())
  ));
create policy "Owners remove venue photos" on public.venue_photos
  for delete to authenticated using (exists (
    select 1 from public.venues v where v.id = venue_id and v.owner_id = (select auth.uid())
  ));
revoke all on public.venue_photos from public, anon, authenticated;
grant select, insert, delete on public.venue_photos to authenticated;

create function public.limit_venue_photos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.venues where id = new.venue_id for update;
  if (select count(*) from public.venue_photos where venue_id = new.venue_id) >= 8 then
    raise exception 'Maximum eight venue photos';
  end if;
  return new;
end;
$$;
revoke all on function public.limit_venue_photos() from public, anon, authenticated;
create trigger venue_photos_limit before insert on public.venue_photos
  for each row execute function public.limit_venue_photos();

commit;
