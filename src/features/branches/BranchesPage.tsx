import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function BranchesPage() {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Branches</h1>
      <div className="bg-white rounded-lg shadow divide-y">
        {branches.map((b: any) => (
          <div key={b.id} className="p-4">
            <div className="font-semibold text-navy">{b.name} <span className="font-mono text-xs text-slate-400">({b.code})</span></div>
            <div className="text-sm text-slate-500">{b.address}</div>
          </div>
        ))}
        {branches.length === 0 && <div className="p-4 text-slate-500">No branches yet.</div>}
      </div>
    </div>
  );
}
