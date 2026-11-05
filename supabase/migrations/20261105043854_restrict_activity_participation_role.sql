begin;
create or replace function public.join_activity(p_activity_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.activities%rowtype; v_count integer; v_name text;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'smashmate_role','player')<>'player' then
    raise exception 'Player account required';
  end if;
  select * into v from public.activities where id=p_activity_id for update;
  if not found or v.cancelled_at is not null or v.starts_at<=now() then raise exception 'Activity unavailable'; end if;
  if v.host_id=auth.uid() then raise exception 'Host already participates'; end if;
  if exists(select 1 from public.activity_participants where activity_id=p_activity_id and user_id=auth.uid()) then raise exception 'Already joined'; end if;
  select count(*) into v_count from public.activity_participants where activity_id=p_activity_id;
  if v_count+1>=v.capacity then raise exception 'Activity is full'; end if;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''),split_part(email,'@',1),'Pemain'),60)
    into v_name from auth.users where id=auth.uid();
  insert into public.activity_participants(activity_id,user_id,display_name)
    values(p_activity_id,auth.uid(),coalesce(v_name,'Pemain'));
end $$;
revoke all on function public.join_activity(uuid) from public,anon;
grant execute on function public.join_activity(uuid) to authenticated;
commit;
