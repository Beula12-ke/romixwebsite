import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type ProfileFull = {
  id: string;
  email: string;
  full_name: string | null;
  role_id: string | null;
  default_branch_id: string | null;
  is_active: boolean;
  role_name: string | null;
  branch_name: string | null;
  branch_code: string | null;
};

export function useProfile() {
  const { user } = useAuth();

  return useQuery<ProfileFull | null>({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const uid = user!.id;

      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role_id, default_branch_id, is_active')
        .eq('id', uid)
        .single();
      if (pErr) throw pErr;
      if (!profile) return null;

      let roleName: string | null = null;
      if (profile.role_id) {
        const { data: role } = await supabase
          .from('roles')
          .select('name')
          .eq('id', profile.role_id)
          .single();
        roleName = role?.name ?? null;
      }

      let branchName: string | null = null;
      let branchCode: string | null = null;
      if (profile.default_branch_id) {
        const { data: branch } = await supabase
          .from('branches')
          .select('name, code')
          .eq('id', profile.default_branch_id)
          .single();
        branchName = branch?.name ?? null;
        branchCode = branch?.code ?? null;
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role_id: profile.role_id,
        default_branch_id: profile.default_branch_id,
        is_active: profile.is_active,
        role_name: roleName,
        branch_name: branchName,
        branch_code: branchCode,
      };
    },
  });
}