-- =========================================================
-- Romix Website — Customers & Bookings (Phase 4A)
-- =========================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email text,
  phone text not null,
  national_id text,
  license_number text,
  license_expiry date,
  address text,
  city text,
  country text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_branch_idx on public.customers(branch_id);
create index customers_phone_idx on public.customers(phone);
create index customers_email_idx on public.customers(email);

create trigger trg_customers_updated
  before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

create policy "customers_select"
  on public.customers for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(branch_id));

create policy "customers_insert"
  on public.customers for insert to authenticated
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  );

create policy "customers_update"
  on public.customers for update to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  )
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  );

create policy "customers_delete"
  on public.customers for delete to authenticated
  using (public.current_role_name() in ('super_admin','owner','platform_admin'));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete restrict,
  pickup_branch_id uuid not null references public.branches(id) on delete restrict,
  return_branch_id uuid not null references public.branches(id) on delete restrict,
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  status text not null default 'enquiry',
  daily_rate numeric(12,2) not null default 0,
  days int not null default 1,
  subtotal numeric(12,2) not null default 0,
  extras numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  internal_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_status_check check (status in (
    'enquiry','pending','confirmed','ready','dispatched',
    'active_hire','returned','completed','cancelled','no_show'
  )),
  constraint bookings_dates_check check (return_at > pickup_at)
);

create index bookings_branch_idx on public.bookings(branch_id);
create index bookings_customer_idx on public.bookings(customer_id);
create index bookings_vehicle_idx on public.bookings(vehicle_id);
create index bookings_dates_idx on public.bookings(pickup_at, return_at);
create index bookings_status_idx on public.bookings(status);

create trigger trg_bookings_updated
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

create policy "bookings_select"
  on public.bookings for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(branch_id));

create policy "bookings_insert"
  on public.bookings for insert to authenticated
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  );

create policy "bookings_update"
  on public.bookings for update to authenticated
  using (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  )
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  );

create policy "bookings_delete"
  on public.bookings for delete to authenticated
  using (public.current_role_name() in ('super_admin','owner','platform_admin'));

-- Availability: returns vehicles that have no overlapping active booking
create or replace function public.available_vehicles(
  p_branch_id uuid,
  p_pickup_at timestamptz,
  p_return_at timestamptz
)
returns table (
  id uuid,
  registration text,
  make text,
  model text,
  year int,
  category text,
  daily_rate numeric
)
language sql stable security definer set search_path = public as $$
  select v.id, v.registration, v.make, v.model, v.year, v.category, v.daily_rate
  from public.vehicles v
  where v.branch_id = p_branch_id
    and v.is_active = true
    and v.status in ('available','reserved','booked')
    and not exists (
      select 1 from public.bookings b
      where b.vehicle_id = v.id
        and b.status in ('confirmed','ready','dispatched','active_hire','returned')
        and b.return_at > p_pickup_at
        and b.pickup_at < p_return_at
    )
  order by v.registration
$$;

grant execute on function public.available_vehicles(uuid, timestamptz, timestamptz) to authenticated;