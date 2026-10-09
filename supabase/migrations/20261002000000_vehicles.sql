-- =========================================================
-- Romix Website — Vehicles (Phase 2A)
-- =========================================================

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  registration text not null unique,
  vin text unique,
  make text not null,
  model text not null,
  year int,
  trim text,
  colour text,
  fuel text,
  transmission text,
  seats int,
  mileage int not null default 0,
  category text,
  ownership_type text not null default 'company',
  daily_rate numeric(12,2) not null default 0,
  status text not null default 'available',
  features jsonb not null default '{}'::jsonb,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_status_check check (status in (
    'available','reserved','booked','preparing','on_route',
    'active_hire','returned','inspection','maintenance',
    'accident','unavailable','retired'
  )),
  constraint vehicles_ownership_check check (ownership_type in (
    'company','partner','leased','financed','other'
  )),
  constraint vehicles_fuel_check check (fuel is null or fuel in (
    'petrol','diesel','electric','hybrid','other'
  )),
  constraint vehicles_transmission_check check (transmission is null or transmission in (
    'manual','automatic','other'
  ))
);

create index vehicles_branch_idx on public.vehicles(branch_id);
create index vehicles_status_idx on public.vehicles(status);
create index vehicles_category_idx on public.vehicles(category);
create index vehicles_active_idx on public.vehicles(is_active);

create trigger trg_vehicles_updated
  before update on public.vehicles
  for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;

create policy "vehicles_select"
  on public.vehicles for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(branch_id));

create policy "vehicles_insert"
  on public.vehicles for insert to authenticated
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create policy "vehicles_update"
  on public.vehicles for update to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  )
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','fleet_staff'))
  );

create policy "vehicles_delete"
  on public.vehicles for delete to authenticated
  using (public.current_role_name() in ('super_admin','owner','platform_admin'));