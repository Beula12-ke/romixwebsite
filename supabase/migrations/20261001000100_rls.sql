-- =========================================================
-- Romix Website — Row Level Security (branch isolation)
-- =========================================================

alter table public.branches        enable row level security;
alter table public.profiles        enable row level security;
alter table public.user_branches   enable row level security;
alter table public.settings        enable row level security;
alter table public.audit_logs      enable row level security;
alter table public.roles           enable row level security;
alter table public.permissions     enable row level security;
alter table public.role_permissions enable row level security;

-- Helpers
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid()
$$;

create or replace function public.is_company_wide()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in (
    'super_admin', 'owner', 'operations_manager',
    'tracking_controller', 'finance', 'platform_admin'
  ), false)
$$;

create or replace function public.belongs_to_branch(branch uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_branches
    where user_id = auth.uid() and branch_id = branch
  )
$$;

-- BRANCHES
create policy "branches_select"
  on public.branches for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(id));

create policy "branches_modify"
  on public.branches for all to authenticated
  using (public.current_role_name() in ('super_admin', 'owner', 'platform_admin'))
  with check (public.current_role_name() in ('super_admin', 'owner', 'platform_admin'));

-- PROFILES
create policy "profiles_self_select"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles_company_view"
  on public.profiles for select to authenticated
  using (public.is_company_wide());

create policy "profiles_branch_view"
  on public.profiles for select to authenticated
  using (default_branch_id is not null and public.belongs_to_branch(default_branch_id));

create policy "profiles_self_update"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_manage"
  on public.profiles for all to authenticated
  using (public.current_role_name() in ('super_admin', 'owner', 'platform_admin'))
  with check (public.current_role_name() in ('super_admin', 'owner', 'platform_admin'));

-- USER_BRANCHES
create policy "user_branches_select"
  on public.user_branches for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_company_wide()
    or public.belongs_to_branch(branch_id)
  );

create policy "user_branches_admin_manage"
  on public.user_branches for all to authenticated
  using (public.current_role_name() in ('super_admin', 'owner', 'platform_admin'))
  with check (public.current_role_name() in ('super_admin', 'owner', 'platform_admin'));

-- SETTINGS
create policy "settings_select"
  on public.settings for select to authenticated
  using (
    (branch_id is null and public.is_company_wide())
    or (branch_id is not null and (public.is_company_wide() or public.belongs_to_branch(branch_id)))
  );

create policy "settings_modify"
  on public.settings for all to authenticated
  using (
    public.current_role_name() in ('super_admin', 'owner', 'platform_admin')
    or (branch_id is not null and public.belongs_to_branch(branch_id) and public.current_role_name() = 'branch_manager')
  )
  with check (
    public.current_role_name() in ('super_admin', 'owner', 'platform_admin')
    or (branch_id is not null and public.belongs_to_branch(branch_id) and public.current_role_name() = 'branch_manager')
  );

-- AUDIT LOGS
create policy "audit_insert"
  on public.audit_logs for insert to authenticated
  with check (true);

create policy "audit_select"
  on public.audit_logs for select to authenticated
  using (public.is_company_wide() or (branch_id is not null and public.belongs_to_branch(branch_id)));

-- ROLES / PERMISSIONS
create policy "roles_read" on public.roles for select to authenticated using (true);
create policy "permissions_read" on public.permissions for select to authenticated using (true);
create policy "role_permissions_read" on public.role_permissions for select to authenticated using (true);
