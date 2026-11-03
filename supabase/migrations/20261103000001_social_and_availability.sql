begin;

create function public.venue_busy_slots(p_venue_id uuid)
returns table(court_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select b.court_id, b.starts_at, b.ends_at
  from public.court_bookings b join public.venues v on v.id = b.venue_id
  where auth.uid() is not null and v.status = 'active' and b.venue_id = p_venue_id
    and b.status in ('pending_payment','confirmed') and b.starts_at >= now()
  order by b.starts_at limit 100;
$$;
revoke all on function public.venue_busy_slots(uuid) from public, anon;
grant execute on function public.venue_busy_slots(uuid) to authenticated;

create table public.coach_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  bio text not null default '' check (char_length(bio) <= 600),
  city text not null default '' check (char_length(city) <= 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coach_profiles enable row level security;
create policy "Players see active coach profiles or their own" on public.coach_profiles
  for select to authenticated using (is_active or user_id = (select auth.uid()));
create policy "Players create their coach profile" on public.coach_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Coaches edit own profile" on public.coach_profiles
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Coaches delete own profile" on public.coach_profiles
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.coach_profiles from anon, authenticated;
grant select, insert, update, delete on public.coach_profiles to authenticated;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  description text not null default '' check (char_length(description) <= 800),
  city text not null default '' check (char_length(city) <= 80),
  created_at timestamptz not null default now()
);
create index communities_owner_idx on public.communities(owner_id);
alter table public.communities enable row level security;
create policy "Members see communities" on public.communities for select to authenticated using (true);
create policy "Players create communities" on public.communities for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Owners edit communities" on public.communities for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners delete communities" on public.communities for delete to authenticated
  using (owner_id = (select auth.uid()));
revoke all on public.communities from anon, authenticated;
grant select, insert, update, delete on public.communities to authenticated;

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members(user_id);
alter table public.community_members enable row level security;
create policy "Members see memberships" on public.community_members for select to authenticated using (true);
create policy "Players join communities" on public.community_members for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Players leave communities" on public.community_members for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.community_members from anon, authenticated;
grant select, insert, delete on public.community_members to authenticated;

alter table public.activities add column community_id uuid references public.communities(id) on delete set null;
alter policy "Users create their own activities" on public.activities
  with check (
    host_id=(select auth.uid()) and starts_at>now() and
    (booking_id is null or exists (
      select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid())
        and b.status='confirmed' and b.starts_at=starts_at
    )) and
    (community_id is null or exists (
      select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())
    ))
  );
alter policy "Hosts can update future activities" on public.activities
  using (host_id=(select auth.uid()) and starts_at>now())
  with check (
    host_id=(select auth.uid()) and starts_at>now() and
    (booking_id is null or exists (
      select 1 from public.court_bookings b where b.id=booking_id and b.player_id=(select auth.uid())
        and b.status='confirmed' and b.starts_at=starts_at
    )) and
    (community_id is null or exists (
      select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())
    ))
  );

commit;
