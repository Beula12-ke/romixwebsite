import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useBookings } from './useBookings';
import { usePermissions } from '@/features/auth/usePermissions';

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

export function BookingListPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const { has } = usePermissions();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return bookings;
    return bookings.filter((b: any) => {
      const cust = b.customers ? `${b.customers.first_name} ${b.customers.last_name}`.toLowerCase() : '';
      const veh = b.vehicles ? `${b.vehicles.registration} ${b.vehicles.make} ${b.vehicles.model}`.toLowerCase() : '';
      return (
        cust.includes(needle) ||
        veh.includes(needle) ||
        b.status?.toLowerCase().includes(needle) ||
        b.id?.toLowerCase().includes(needle)
      );
    });
  }, [bookings, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Bookings</h1>
        {has('bookings.manage') && (
          <Link
            to="/bookings/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus size={16} /> New Booking
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer, vehicle, status…"
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your search.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Customer</th>
                <th>Vehicle</th>
                <th>Pickup</th>
                <th>Return</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b: any) => (
                <tr key={b.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium text-navy">
                      {b.customers
                        ? `${b.customers.first_name} ${b.customers.last_name}`
                        : '—'}
                    </div>
                    {b.customers?.phone && (
                      <div className="text-xs text-slate-500">{b.customers.phone}</div>
                    )}
                  </td>
                  <td>
                    {b.vehicles ? (
                      <>
                        <div className="font-medium text-navy">
                          {b.vehicles.make} {b.vehicles.model}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {b.vehicles.registration}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="text-xs">{fmt(b.pickup_at)}</td>
                  <td className="text-xs">{fmt(b.return_at)}</td>
                  <td className="font-mono">
                    {b.total ? `$${Number(b.total).toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        STATUS_COLOURS[b.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {String(b.status).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}