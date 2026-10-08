import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile } from './useProfile';

export function usePermissions() {
  const { data: profile, isLoading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: ['permissions', profile?.role_id],
    enabled: !!profile?.role_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permissions(name)')
        .eq('role_id', profile!.role_id!);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.permissions.name as string);
    },
  });

  const perms = new Set(query.data ?? []);

  return {
    loading: profileLoading || query.isLoading,
    has: (p: string) => perms.has(p),
    list: Array.from(perms),
  };
}
