-- =========================================================
-- Romix Website — Vehicle Media & Documents (Phase 2B)
-- =========================================================

create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  caption text,
  display_order int not null default 0,
  is_featured boolean not null default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index vehicle_media_vehicle_idx on public.vehicle_media(vehicle_id);
create index vehicle_media_branch_idx on public.vehicle_media(branch_id);

alter table public.vehicle_media enable row level security;

create policy "vehicle_media_select"
  on public.vehicle_media for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(branch_id));

create policy "vehicle_media_insert"
  on public.vehicle_media for insert to authenticated
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create policy "vehicle_media_update"
  on public.vehicle_media for update to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  )
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create policy "vehicle_media_delete"
  on public.vehicle_media for delete to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  document_type text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  issue_date date,
  expiry_date date,
  notes text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_documents_type_check check (document_type in (
    'insurance','logbook','inspection','permit','contract','other'
  ))
);

create index vehicle_documents_vehicle_idx on public.vehicle_documents(vehicle_id);
create index vehicle_documents_branch_idx on public.vehicle_documents(branch_id);
create index vehicle_documents_expiry_idx on public.vehicle_documents(expiry_date);

create trigger trg_vehicle_documents_updated
  before update on public.vehicle_documents
  for each row execute function public.set_updated_at();

alter table public.vehicle_documents enable row level security;

create policy "vehicle_documents_select"
  on public.vehicle_documents for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(branch_id));

create policy "vehicle_documents_insert"
  on public.vehicle_documents for insert to authenticated
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create policy "vehicle_documents_update"
  on public.vehicle_documents for update to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  )
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create policy "vehicle_documents_delete"
  on public.vehicle_documents for delete to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-media',
  'vehicle-media',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Storage policies (branch-scoped via path prefix)
create policy "vehicle_media_storage_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'vehicle-media'
    and (
      public.is_company_wide()
      or public.belongs_to_branch((storage.foldername(name))[1]::uuid)
    )
  );

create policy "vehicle_media_storage_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-media'
    and (
      public.is_company_wide()
      or (public.belongs_to_branch((storage.foldername(name))[1]::uuid)
          and public.current_role_name() in ('branch_manager','fleet_staff'))
    )
  );

create policy "vehicle_media_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vehicle-media'
    and (
      public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
      or (public.belongs_to_branch((storage.foldername(name))[1]::uuid)
          and public.current_role_name() in ('branch_manager','fleet_staff'))
    )
  );