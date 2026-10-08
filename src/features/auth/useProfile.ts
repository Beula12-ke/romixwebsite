import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(name), branches:default_branch_id(id, name, code)')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
