import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type BookingStatus =
  | 'enquiry' | 'pending' | 'confirmed' | 'ready' | 'dispatched'
  | 'active_hire' | 'returned' | 'completed' | 'cancelled' | 'no_show';

export type Booking = {
  id: string;
  branch_id: string;
  customer_id: string;
  vehicle_id: string | null;
  pickup_branch_id: string;
  return_branch_id: string;
  pickup_at: string;
  return_at: string;
  status: BookingStatus;
  daily_rate: number;
  days: number;
  subtotal: number;
  extras: number;
  deposit: number;
  tax: number;
  total: number;
  notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingInput = Omit<
  Booking,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

const KEY = ['bookings'];

export function useBookings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers(id, first_name, last_name, phone, email),
          vehicles(id, registration, make, model),
          pickup_branch:branches!bookings_pickup_branch_id_fkey(id, name, code)
        `)
        .order('pickup_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers(id, first_name, last_name, phone, email, license_number),
          vehicles(id, registration, make, model, year),
          pickup_branch:branches!bookings_pickup_branch_id_fkey(id, name, code)
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingInput) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BookingInput> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}