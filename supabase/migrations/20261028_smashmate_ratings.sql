-- Rating only between attendees after an activity has started.
begin;

alter table public.activities add column host_name text not null default 'Pemain'
  check (char_length(host_name) between 1 and 60);
alter table public.activity_participants add column display_name text not null default 'Pemain'
  check (char_length(display_name) between 1 and 60);

create or replace function public.join_activity(p_activity_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_activity public.activities%rowtype;
  v_count integer;
  v_name text;
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
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'), ''), split_part(email, '@', 1), 'Pemain'), 60)
    into v_name from auth.users where id = auth.uid();
  insert into public.activity_participants(activity_id, user_id, display_name)
    values (p_activity_id, auth.uid(), coalesce(v_name, 'Pemain'));
end;
$$;
revoke all on function public.join_activity(uuid) from public, anon;
grant execute on function public.join_activity(uuid) to authenticated;

create table public.activity_ratings (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  unique (activity_id, reviewer_id, recipient_id),
  check (reviewer_id <> recipient_id)
);
create index activity_ratings_recipient_id_idx on public.activity_ratings(recipient_id);
alter table public.activity_ratings enable row level security;
create policy "Participants view ratings about them or by them" on public.activity_ratings
  for select to authenticated using (
    reviewer_id = (select auth.uid()) or recipient_id = (select auth.uid())
  );
grant select on public.activity_ratings to authenticated;

create function public.rate_activity_participant(p_activity_id uuid, p_recipient_id uuid, p_stars integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_activity public.activities%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if p_stars not between 1 and 5 or p_recipient_id = auth.uid() then raise exception 'Invalid rating'; end if;
  select * into v_activity from public.activities where id = p_activity_id;
  if not found or v_activity.starts_at > now() then raise exception 'Activity not finished'; end if;
  if v_activity.host_id <> auth.uid() and not exists (
    select 1 from public.activity_participants where activity_id = p_activity_id and user_id = auth.uid()
  ) then raise exception 'Reviewer did not attend'; end if;
  if v_activity.host_id <> p_recipient_id and not exists (
    select 1 from public.activity_participants where activity_id = p_activity_id and user_id = p_recipient_id
  ) then raise exception 'Recipient did not attend'; end if;
  insert into public.activity_ratings(activity_id, reviewer_id, recipient_id, stars)
    values (p_activity_id, auth.uid(), p_recipient_id, p_stars);
end;
$$;
revoke all on function public.rate_activity_participant(uuid,uuid,integer) from public, anon;
grant execute on function public.rate_activity_participant(uuid,uuid,integer) to authenticated;

commit;
