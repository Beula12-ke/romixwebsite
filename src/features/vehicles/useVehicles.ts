import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Vehicle, VehicleInput, VehicleStatus } from '@/types/database';

const KEY = ['vehicles'];

export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, branches(id, name, code)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery<Vehicle>({
    queryKey: [...KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, branches(id, name, code)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: VehicleInput) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<VehicleInput> }) => {
      const { data, error } = await supabase
        .from('vehicles')
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

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export type { Vehicle, VehicleInput, VehicleStatus };