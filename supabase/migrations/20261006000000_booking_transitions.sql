-- =========================================================
-- Romix Website — Booking Status Transitions (Phase 4B)
-- =========================================================

create or replace function public.transition_booking(
  p_booking_id uuid,
  p_new_status text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_vehicle_status text;
begin
  if p_new_status not in (
    'enquiry','pending','confirmed','ready','dispatched',
    'active_hire','returned','completed','cancelled','no_show'
  ) then
    raise exception 'Invalid booking status: %', p_new_status;
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found';
  end if;

  update public.bookings
    set status = p_new_status
    where id = p_booking_id
    returning * into v_booking;

  if v_booking.vehicle_id is not null then
    v_vehicle_status := case p_new_status
      when 'confirmed' then 'booked'
      when 'ready' then 'preparing'
      when 'dispatched' then 'on_route'
      when 'active_hire' then 'active_hire'
      when 'returned' then 'inspection'
      when 'completed' then 'available'
      when 'cancelled' then 'available'
      when 'no_show' then 'available'
      else null
    end;

    if v_vehicle_status is not null then
      update public.vehicles
        set status = v_vehicle_status
        where id = v_booking.vehicle_id;
    end if;
  end if;

  return v_booking;
end $$;

grant execute on function public.transition_booking(uuid, text) to authenticated;