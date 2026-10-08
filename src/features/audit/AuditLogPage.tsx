import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function AuditLogPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Time</th>
              <th>Action</th>
              <th>Entity</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{new Date(l.created_at).toLocaleString()}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td>{l.entity_type}</td>
                <td className="font-mono text-xs">{l.user_id?.slice(0, 8) ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-slate-500">No audit entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
