import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UserListItem {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  role: { name: string } | null;
  branches: { name: string } | null;
}

interface UserListRawItem {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  role: { name: string }[] | null;
  branches: { name: string }[] | null;
}

export function UserListPage() {
  const { data: users = [], isLoading } = useQuery<UserListItem[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, role:role_id(name), branches:default_branch_id(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((u: UserListRawItem) => ({
        ...u,
        role: u.role?.[0] ?? null,
        branches: u.branches?.[0] ?? null,
      }));
    },
  });

  if (isLoading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Users</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: UserListItem) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.full_name || '—'}</td>
                <td>{u.email}</td>
                <td>{u.role?.name ?? '—'}</td>
                <td>{u.branches?.name ?? '—'}</td>
                <td>{u.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
