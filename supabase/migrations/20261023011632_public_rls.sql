-- Public RLS policies + vehicle status reset
drop policy if exists "branches_public_read" on public.branches;
create policy "branches_public_read"
  on public.branches for select to anon
  using (is_active = true);

drop policy if exists "vehicles_public_read" on public.vehicles;
create policy "vehicles_public_read"
  on public.vehicles for select to anon
  using (is_active = true);

drop policy if exists "vehicle_media_public_read" on public.vehicle_media;
create policy "vehicle_media_public_read"
  on public.vehicle_media for select to anon
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_media.vehicle_id and v.is_active = true
    )
  );

update public.vehicles
set status = 'available'
where status not in ('maintenance', 'retired');
