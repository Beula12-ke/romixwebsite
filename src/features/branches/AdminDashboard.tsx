import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/features/auth/usePermissions';
import { Navigate } from 'react-router-dom';

export function AdminDashboard() {
  const { has, loading } = usePermissions();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) return <div>Loading…</div>;
  if (!has('branches.manage')) return <Navigate to="/branch/dashboard" replace />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Company Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Total Branches" value={branches.length} />
        <Card label="Active Branches" value={branches.filter((b: any) => b.is_active).length} />
        <Card label="Fleet Size" value="—" hint="Vehicles module coming in Phase 3" />
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-navy mb-4">Branches</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2">Code</th>
              <th>Name</th>
              <th>Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b: any) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="py-2 font-mono">{b.code}</td>
                <td>{b.name}</td>
                <td className="text-slate-500">{b.address}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-xs ${b.is_active ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-navy mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}
