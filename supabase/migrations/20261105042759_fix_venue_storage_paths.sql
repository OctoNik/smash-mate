begin;
-- Qualify the storage object's name; bare name resolved to venues.name.
alter policy "Venue owners read product images" on storage.objects using (
  bucket_id='venue-products' and exists (
    select 1 from public.venues v where v.id::text=split_part(storage.objects.name,'/',1)
      and v.owner_id=(select auth.uid())
  )
);
alter policy "Venue owners upload product images" on storage.objects with check (
  bucket_id='venue-products' and exists (
    select 1 from public.venues v where v.id::text=split_part(storage.objects.name,'/',1)
      and v.owner_id=(select auth.uid())
  )
);
alter policy "Venue owners replace product images" on storage.objects using (
  bucket_id='venue-products' and exists (
    select 1 from public.venues v where v.id::text=split_part(storage.objects.name,'/',1)
      and v.owner_id=(select auth.uid())
  )
) with check (
  bucket_id='venue-products' and exists (
    select 1 from public.venues v where v.id::text=split_part(storage.objects.name,'/',1)
      and v.owner_id=(select auth.uid())
  )
);
alter policy "Venue owners delete product images" on storage.objects using (
  bucket_id='venue-products' and exists (
    select 1 from public.venues v where v.id::text=split_part(storage.objects.name,'/',1)
      and v.owner_id=(select auth.uid())
  )
);
commit;
