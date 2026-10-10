import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Customer = {
  id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  national_id: string | null;
  license_number: string | null;
  license_expiry: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerInput = Omit<
  Customer,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'
>;

const KEY = ['customers'];

export function useCustomers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, branches(id, name, code)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, branches(id, name, code)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CustomerInput> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}