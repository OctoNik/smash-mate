begin;

create function public.require_partner_password_before_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'draft' and new.status = 'active' and exists (
    select 1 from auth.users u where u.id = new.owner_id
      and u.raw_app_meta_data->>'password_setup_required' = 'true'
  ) then
    raise exception 'Set a private password before publishing the venue';
  end if;
  return new;
end;
$$;
revoke all on function public.require_partner_password_before_publish() from public, anon, authenticated;

create trigger partner_password_before_venue_publish
  before update of status on public.venues
  for each row execute function public.require_partner_password_before_publish();

commit;
