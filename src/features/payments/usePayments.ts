import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';

export type PaymentMethod =
  | 'cash' | 'card' | 'mpesa' | 'bank_transfer' | 'cheque' | 'other';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type Payment = {
  id: string;
  booking_id: string;
  branch_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  status: PaymentStatus;
  paid_at: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
};

export function useBookingPayments(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['payments', bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId!)
        .order('paid_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      bookingId: string;
      branchId: string;
      amount: number;
      method: PaymentMethod;
      reference?: string | null;
      notes?: string | null;
      paidAt?: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          booking_id: input.bookingId,
          branch_id: input.branchId,
          amount: input.amount,
          method: input.method,
          reference: input.reference || null,
          notes: input.notes || null,
          status: 'succeeded',
          paid_at: input.paidAt || new Date().toISOString(),
          recorded_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['payments', vars.bookingId] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; booking_id: string }) => {
      const { error } = await supabase.from('payments').delete().eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['payments', vars.booking_id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings', vars.booking_id] });
    },
  });
}

export function useTotalPaidForBooking(bookingId: string | undefined) {
  const q = useBookingPayments(bookingId);
  const total = (q.data ?? [])
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return { total, ...q };
}