begin;
create function public.require_sparring_acceptance() returns trigger language plpgsql set search_path='' as $$
begin
 if new.sparring_opponent_id is not null and current_user<>'postgres' then
  raise exception 'Sparring requires opponent acceptance';
 end if;
 return new;
end $$;
create trigger require_sparring_acceptance before insert on public.activities for each row execute function public.require_sparring_acceptance();
commit;
