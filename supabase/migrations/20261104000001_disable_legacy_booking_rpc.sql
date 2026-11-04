-- The old RPC only counts legacy racket reservations. Direct player calls would
-- bypass the multi-item stock check, so players must use book_court_with_items.
revoke execute on function public.book_court(uuid,timestamptz,integer,uuid,integer,uuid,integer) from authenticated;
