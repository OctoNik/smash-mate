-- Preserve attendee and rating history once an activity has started.
begin;

drop policy "Hosts can delete their own activities" on public.activities;
create policy "Hosts can delete their future activities" on public.activities
  for delete to authenticated using (
    host_id = (select auth.uid()) and starts_at > now()
  );

drop policy "Users leave their own activities" on public.activity_participants;
create policy "Users leave their own future activities" on public.activity_participants
  for delete to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.activities where id = activity_id and starts_at > now()
    )
  );

commit;
