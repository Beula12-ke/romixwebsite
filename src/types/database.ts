// Placeholder. Regenerate with: npm run db:types
export type Database = Record<string, unknown>;

// Auth & Profile types
export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  opening_hours: Record<string, unknown> | null;
  services: Record<string, unknown> | null;
  pickup_instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role_id: string | null;
  default_branch_id: string | null;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  role: Role | null;
  branches: Branch | null;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
}

// Vehicle types
export interface Vehicle {
  id: string;
  branch_id: string;
  registration: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  colour: string | null;
  fuel: string | null;
  transmission: string | null;
  seats: number | null;
  mileage: number;
  category: string | null;
  ownership_type: string;
  daily_rate: number;
  status: VehicleStatus;
  features: Record<string, unknown>;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  branches: Branch | null;
}

export type VehicleStatus =
  | 'available' | 'reserved' | 'booked' | 'preparing' | 'on_route'
  | 'active_hire' | 'returned' | 'inspection' | 'maintenance'
  | 'accident' | 'unavailable' | 'retired';

export type VehicleInput = Omit<
  Vehicle,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'features' | 'branches'
> & { features?: Record<string, unknown> };