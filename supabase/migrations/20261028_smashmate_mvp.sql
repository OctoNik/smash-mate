-- SmashMate MVP. Run once in Supabase SQL Editor.
begin;

create extension if not exists pgcrypto;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('match', 'coaching', 'event')),
  title text not null check (char_length(title) between 5 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  location text not null check (char_length(location) between 3 and 160),
  starts_at timestamptz not null,
  capacity integer not null check (capacity between 2 and 100),
  level text not null check (level in ('beginner', 'intermediate', 'professional', 'all')),
  created_at timestamptz not null default now()
);

create index if not exists activities_starts_at_idx on public.activities(starts_at);
create index if not exists activities_host_id_idx on public.activities(host_id);
alter table public.activities enable row level security;

create policy "Authenticated users can view activities" on public.activities
  for select to authenticated using (true);
create policy "Users create their own activities" on public.activities
  for insert to authenticated with check (host_id = (select auth.uid()) and starts_at > now());
create policy "Hosts can update future activities" on public.activities
  for update to authenticated using (host_id = (select auth.uid()) and starts_at > now())
  with check (host_id = (select auth.uid()) and starts_at > now());
create policy "Hosts can delete their own activities" on public.activities
  for delete to authenticated using (host_id = (select auth.uid()));

create table if not exists public.activity_participants (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create index if not exists activity_participants_user_id_idx on public.activity_participants(user_id);
alter table public.activity_participants enable row level security;
create policy "Authenticated users view participants" on public.activity_participants
  for select to authenticated using (true);
create policy "Users leave their own activities" on public.activity_participants
  for delete to authenticated using (user_id = (select auth.uid()));

-- Joining is atomic: lock the activity row and check free slots before insert.
create or replace function public.join_activity(p_activity_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_activity public.activities%rowtype;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_activity from public.activities where id = p_activity_id for update;
  if not found then raise exception 'Activity not found'; end if;
  if v_activity.starts_at <= now() then raise exception 'Activity already started'; end if;
  if v_activity.host_id = auth.uid() then raise exception 'Host already participates'; end if;
  if exists (select 1 from public.activity_participants where activity_id = p_activity_id and user_id = auth.uid()) then
    raise exception 'Already joined';
  end if;
  select count(*) into v_count from public.activity_participants where activity_id = p_activity_id;
  if v_count + 1 >= v_activity.capacity then raise exception 'Activity is full'; end if;
  insert into public.activity_participants(activity_id, user_id) values (p_activity_id, auth.uid());
end;
$$;
revoke all on function public.join_activity(uuid) from public, anon;
grant execute on function public.join_activity(uuid) to authenticated;

create table if not exists public.equipment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('racket_rental', 'shuttle_purchase')),
  quantity integer not null check (quantity between 1 and 20),
  needed_at date not null,
  notes text not null default '' check (char_length(notes) <= 500),
  status text not null default 'submitted' check (status in ('submitted', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists equipment_requests_user_id_idx on public.equipment_requests(user_id);
alter table public.equipment_requests enable row level security;
create policy "Users view their equipment requests" on public.equipment_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users create their equipment requests" on public.equipment_requests
  for insert to authenticated with check (
    user_id = (select auth.uid()) and status = 'submitted' and needed_at >= current_date
  );

create or replace function public.cancel_equipment_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  update public.equipment_requests set status = 'cancelled'
  where id = p_request_id and user_id = auth.uid() and status = 'submitted';
  if not found then raise exception 'Request not found'; end if;
end;
$$;
revoke all on function public.cancel_equipment_request(uuid) from public, anon;
grant execute on function public.cancel_equipment_request(uuid) to authenticated;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug', 'idea', 'other')),
  message text not null check (char_length(message) between 10 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists feedback_user_id_idx on public.feedback(user_id);
alter table public.feedback enable row level security;
create policy "Users view their feedback" on public.feedback
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users submit their feedback" on public.feedback
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.activities to authenticated;
grant select, delete on public.activity_participants to authenticated;
grant select, insert on public.equipment_requests to authenticated;
grant select, insert on public.feedback to authenticated;

-- Private profile photos. Users can only access their own fixed avatar path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('smashmate-avatars', 'smashmate-avatars', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Users read their own avatar" on storage.objects
  for select to authenticated using (
    bucket_id = 'smashmate-avatars' and name = (select auth.uid()::text) || '/avatar'
  );
create policy "Users upload their own avatar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'smashmate-avatars' and name = (select auth.uid()::text) || '/avatar'
  );
create policy "Users replace their own avatar" on storage.objects
  for update to authenticated using (
    bucket_id = 'smashmate-avatars' and name = (select auth.uid()::text) || '/avatar'
  ) with check (
    bucket_id = 'smashmate-avatars' and name = (select auth.uid()::text) || '/avatar'
  );
create policy "Users delete their own avatar" on storage.objects
  for delete to authenticated using (
    bucket_id = 'smashmate-avatars' and name = (select auth.uid()::text) || '/avatar'
  );

commit;
