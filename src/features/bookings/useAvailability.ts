import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type AvailableVehicle = {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  category: string | null;
  daily_rate: number;
};

export function useAvailability(
  branchId: string | null | undefined,
  pickupAt: string | null,
  returnAt: string | null,
) {
  const enabled = !!branchId && !!pickupAt && !!returnAt && new Date(returnAt) > new Date(pickupAt);

  return useQuery<AvailableVehicle[]>({
    queryKey: ['availability', branchId, pickupAt, returnAt],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('available_vehicles', {
        p_branch_id: branchId!,
        p_pickup_at: pickupAt!,
        p_return_at: returnAt!,
      });
      if (error) throw error;
      return (data ?? []) as AvailableVehicle[];
    },
  });
}