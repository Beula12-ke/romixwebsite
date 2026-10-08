-- Roles
insert into public.roles (name, description) values
  ('super_admin', 'Full platform control'),
  ('owner', 'Company owner'),
  ('operations_manager', 'Operations oversight'),
  ('branch_manager', 'Own branch only'),
  ('booking_staff', 'Bookings, customers, dispatch'),
  ('fleet_staff', 'Vehicles, inspections, maintenance'),
  ('driver', 'Assigned trips'),
  ('finance', 'Payments, invoices, refunds'),
  ('tracking_controller', 'Live tracking'),
  ('partner', 'Partner portal'),
  ('customer', 'Customer portal')
on conflict (name) do nothing;

-- Permissions
insert into public.permissions (name, description) values
  ('branches.manage', 'Create/edit branches'),
  ('users.manage', 'Invite/edit users'),
  ('vehicles.manage', 'Create/edit vehicles'),
  ('bookings.manage', 'Create/edit bookings'),
  ('customers.manage', 'Manage customers'),
  ('payments.manage', 'Process payments/refunds'),
  ('maintenance.manage', 'Manage maintenance jobs'),
  ('tracking.view', 'View live tracking'),
  ('pricing.manage', 'Manage pricing'),
  ('partners.manage', 'Manage partners'),
  ('reports.view', 'View reports'),
  ('audit.view', 'View audit logs')
on conflict (name) do nothing;

-- super_admin + owner: all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name in ('super_admin', 'owner')
on conflict do nothing;

-- branch_manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name = 'branch_manager'
  and p.name in ('vehicles.manage','bookings.manage','customers.manage','maintenance.manage','reports.view')
on conflict do nothing;

-- booking_staff
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name = 'booking_staff'
  and p.name in ('bookings.manage','customers.manage')
on conflict do nothing;

-- fleet_staff
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name = 'fleet_staff'
  and p.name in ('vehicles.manage','maintenance.manage')
on conflict do nothing;

-- finance
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name = 'finance'
  and p.name in ('payments.manage','reports.view')
on conflict do nothing;

-- tracking_controller
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name = 'tracking_controller'
  and p.name in ('tracking.view')
on conflict do nothing;

-- One demo branch
insert into public.branches (code, name, address, is_active) values
  ('HQ', 'Head Office', 'Nairobi, Kenya', true)
on conflict (code) do nothing;
