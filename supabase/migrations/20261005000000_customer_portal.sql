-- =========================================================
-- Romix Website — Customer Registration & Portal (Phase 4C)
-- =========================================================

alter table public.customers
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create unique index if not exists customers_user_id_unique
  on public.customers(user_id)
  where user_id is not null;

-- Rewrite the new-user trigger: default role = customer, auto-create customer record
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role_id uuid;
  v_role_name text;
  v_branch_id uuid;
begin
  v_role_name := coalesce(new.raw_user_meta_data->>'intended_role', 'customer');
  select id into v_role_id from public.roles where name = v_role_name;

  insert into public.profiles (id, email, full_name, role_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_role_id
  );

  if v_role_name = 'customer' then
    select id into v_branch_id from public.branches order by created_at limit 1;
    if v_branch_id is not null then
      insert into public.customers
        (branch_id, first_name, last_name, email, phone, user_id, created_by)
      values (
        v_branch_id,
        coalesce(new.raw_user_meta_data->>'first_name', 'Customer'),
        coalesce(new.raw_user_meta_data->>'last_name', 'User'),
        new.email,
        coalesce(new.raw_user_meta_data->>'phone', ''),
        new.id,
        new.id
      )
      on conflict (user_id) do nothing;
    end if;
  end if;

  return new;
end $$;

-- RLS: customers can see their own customer record
create policy "customers_self_select"
  on public.customers for select to authenticated
  using (user_id = auth.uid());

-- RLS: customers can see their own bookings
create policy "bookings_customer_self_select"
  on public.bookings for select to authenticated
  using (
    customer_id in (
      select id from public.customers where user_id = auth.uid()
    )
  );

-- RLS: customers can see branches (needed for booking display)
create policy "branches_customer_read"
  on public.branches for select to authenticated
  using (public.current_role_name() = 'customer');

-- RLS: customers can see vehicles they have booked
create policy "vehicles_customer_visible"
  on public.vehicles for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      join public.customers c on c.id = b.customer_id
      where b.vehicle_id = vehicles.id
        and c.user_id = auth.uid()
    )
  );