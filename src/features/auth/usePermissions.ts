import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile } from './useProfile';

export function usePermissions() {
  const { data: profile, isLoading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: ['permissions', profile?.role_id],
    enabled: !!profile?.role_id,
    queryFn: async () => {
      const roleId = profile!.role_id!;

      const { data: links, error: linksError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
      if (linksError) throw linksError;

      const ids = (links ?? []).map((r: any) => r.permission_id);
      if (ids.length === 0) return [];

      const { data: perms, error: permsError } = await supabase
        .from('permissions')
        .select('name')
        .in('id', ids);
      if (permsError) throw permsError;

      return (perms ?? []).map((p: any) => p.name as string);
    },
  });

  const permSet = new Set(query.data ?? []);

  return {
    loading: profileLoading || query.isLoading,
    has: (p: string) => permSet.has(p),
    list: Array.from(permSet),
  };
}