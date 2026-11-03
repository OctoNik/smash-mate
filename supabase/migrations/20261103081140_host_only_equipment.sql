begin;

-- Equipment is selected by the host in book_court. Keep old order records
-- readable, but stop creating standalone shuttlecock purchases.
revoke execute on function public.purchase_shuttlecock(uuid,integer) from authenticated;

-- One confirmed court booking can organize one activity.
create unique index if not exists activities_one_per_booking_idx
  on public.activities(booking_id) where booking_id is not null;

commit;
