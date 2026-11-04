begin;
drop policy if exists "Hosts can delete their future activities" on public.activities;
revoke delete on public.activities from authenticated;
create function public.guard_activity_history() returns trigger language plpgsql set search_path='' as $$
begin
 if old.cancelled_at is not null then raise exception 'Cancelled activity cannot be changed'; end if;
 if new.host_id<>old.host_id or new.community_id is distinct from old.community_id or new.sparring_opponent_id is distinct from old.sparring_opponent_id or new.booking_id is distinct from old.booking_id then raise exception 'Activity ownership and booking cannot change'; end if;
 if new.cancelled_at is not null and new.cancelled_at>now()+interval '1 minute' then raise exception 'Invalid cancellation time'; end if;
 return new;
end $$;
create trigger guard_activity_history before update on public.activities for each row execute function public.guard_activity_history();
commit;
