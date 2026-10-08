-- =========================================================
-- Romix Website — Foundation
-- =========================================================

create extension if not exists "pgcrypto";

-- Branches
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  email text,
  opening_hours jsonb,
  services jsonb,
  pickup_instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- Permissions
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- Role ↔ Permission
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role_id uuid references public.roles(id),
  default_branch_id uuid references public.branches(id),
  is_active boolean not null default true,
  mfa_enabled boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User ↔ Branch membership
create table public.user_branches (
  user_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  primary key (user_id, branch_id)
);

-- Settings
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, setting_key)
);

-- Audit logs
create table public.audit_logs (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_branches_updated
  before update on public.branches
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_settings_updated
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
