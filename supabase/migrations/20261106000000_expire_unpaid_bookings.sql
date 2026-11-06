-- Expire unpaid bookings after their scheduled start and release reserved stock.
alter table public.court_bookings
  add column if not exists cancelled_reason text
  check (cancelled_reason is null or cancelled_reason = 'expired');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.expire_unpaid_bookings()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.court_bookings
       set status = 'cancelled', cancelled_reason = 'expired'
     where status = 'pending_payment' and starts_at <= now()
     returning id, shuttle_product_id, shuttle_quantity
  ), restored as (
    select shuttle_product_id as product_id, shuttle_quantity as quantity
      from expired where shuttle_product_id is not null
    union all
    select i.product_id, i.quantity
      from public.court_booking_items i
      join expired e on e.id = i.booking_id
     where i.kind = 'shuttlecock_sale'
  ), totals as (
    select product_id, sum(quantity)::integer as quantity
      from restored group by product_id
  ), stock_update as (
    update public.venue_products p
       set stock = p.stock + t.quantity
      from totals t where p.id = t.product_id
     returning p.id
  )
  select count(*)::integer into v_count from expired;
  return v_count;
end;
$$;
revoke all on function private.expire_unpaid_bookings() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'smashmate-expire-unpaid-bookings',
  '*/5 * * * *',
  'select private.expire_unpaid_bookings()'
);
