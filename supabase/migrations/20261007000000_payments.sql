-- =========================================================
-- Romix Website — Payments (Phase 5)
-- =========================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  amount numeric(12,2) not null,
  method text not null default 'cash',
  reference text,
  status text not null default 'succeeded',
  paid_at timestamptz not null default now(),
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_method_check check (method in (
    'cash','card','mpesa','bank_transfer','cheque','other'
  )),
  constraint payments_status_check check (status in (
    'pending','succeeded','failed','refunded'
  )),
  constraint payments_amount_check check (amount > 0)
);

create index payments_booking_idx on public.payments(booking_id);
create index payments_branch_idx on public.payments(branch_id);
create index payments_paid_at_idx on public.payments(paid_at);

alter table public.payments enable row level security;

create policy "payments_select"
  on public.payments for select to authenticated
  using (public.is_company_wide() or public.belongs_to_branch(branch_id));

create policy "payments_insert"
  on public.payments for insert to authenticated
  with check (
    public.current_role_name() in ('super_admin','owner','platform_admin','operations_manager','finance')
    or (public.belongs_to_branch(branch_id) and public.current_role_name() in ('branch_manager','booking_staff'))
  );

create policy "payments_update"
  on public.payments for update to authenticated
  using (public.current_role_name() in ('super_admin','owner','platform_admin','finance'))
  with check (public.current_role_name() in ('super_admin','owner','platform_admin','finance'));

create policy "payments_delete"
  on public.payments for delete to authenticated
  using (public.current_role_name() in ('super_admin','owner','platform_admin'));

-- Add payment_status to bookings for quick filtering
alter table public.bookings
  add column if not exists payment_status text not null default 'unpaid';

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check check (payment_status in (
    'unpaid','partial','paid','refunded'
  ));

-- Trigger: recompute payment_status after insert/update/delete
create or replace function public.recompute_booking_payment_status(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_total numeric;
  v_paid numeric;
  v_new_status text;
begin
  select total into v_total from public.bookings where id = p_booking_id;
  if v_total is null then return; end if;

  select coalesce(sum(amount), 0) into v_paid
  from public.payments
  where booking_id = p_booking_id
    and status = 'succeeded';

  v_new_status := case
    when v_paid <= 0 then 'unpaid'
    when v_paid >= v_total then 'paid'
    else 'partial'
  end;

  update public.bookings
    set payment_status = v_new_status
    where id = p_booking_id;
end $$;

create or replace function public.trg_payments_recompute()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_booking_payment_status(old.booking_id);
    return old;
  else
    perform public.recompute_booking_payment_status(new.booking_id);
    if tg_op = 'UPDATE' and old.booking_id <> new.booking_id then
      perform public.recompute_booking_payment_status(old.booking_id);
    end if;
    return new;
  end if;
end $$;

create trigger trg_payments_status
  after insert or update or delete on public.payments
  for each row execute function public.trg_payments_recompute();

-- Backfill existing bookings
do $$
declare r record;
begin
  for r in select id from public.bookings loop
    perform public.recompute_booking_payment_status(r.id);
  end loop;
end $$;