begin;
alter table public.activities add column sparring_opponent_id uuid references public.communities(id) on delete set null;
alter table public.activities add constraint sparring_opponent_valid check
  (sparring_opponent_id is null or (kind='event' and community_id is not null and sparring_opponent_id<>community_id));
create index activities_sparring_opponent_idx on public.activities(sparring_opponent_id) where sparring_opponent_id is not null;
commit;
