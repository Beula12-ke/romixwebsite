import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';

const STATUS_COLOURS: Record<string, string> = {
  enquiry: 'bg-slate-100 text-slate-700',
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-blue-100 text-blue-700',
  ready: 'bg-blue-100 text-blue-700',
  dispatched: 'bg-primary/10 text-primary',
  active_hire: 'bg-primary/10 text-primary',
  returned: 'bg-slate-100 text-slate-700',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
  no_show: 'bg-danger/10 text-danger',
};

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function MyBookingsPage() {
  const { data: profile } = useProfile();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my_bookings', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles(id, registration, make, model, year),
          pickup_branch:branches!bookings_pickup_branch_id_fkey(name, code)
        `)
        .order('pickup_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-navy">My Bookings</h1>

      {isLoading ? (
        <div className="text-slate-500">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          <Calendar size={40} className="mx-auto text-slate-300" />
          <p className="mt-3">You have no bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-navy">
                    {b.vehicles
                      ? `${b.vehicles.make} ${b.vehicles.model} ${b.vehicles.year ?? ''}`
                      : 'Vehicle TBD'}
                  </div>
                  {b.vehicles?.registration && (
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {b.vehicles.registration}
                    </div>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    STATUS_COLOURS[b.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {String(b.status).replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-slate-500 text-xs">Pickup</div>
                    <div className="text-navy">{fmt(b.pickup_at)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-slate-500 text-xs">Return</div>
                    <div className="text-navy">{fmt(b.return_at)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-slate-500 text-xs">Branch</div>
                    <div className="text-navy">{(b.pickup_branch as any)?.name ?? '—'}</div>
                  </div>
                </div>
                <div className="text-right md:text-right">
                  <div className="text-slate-500 text-xs">Total</div>
                  <div className="text-navy font-semibold">
                    {b.total ? `$${Number(b.total).toLocaleString()}` : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}