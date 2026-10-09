import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useVehicles } from './useVehicles';
import { usePermissions } from '@/features/auth/usePermissions';
import type { Vehicle } from '@/types/database';

const STATUS_COLOURS: Record<string, string> = {
  available: 'bg-success/10 text-success',
  reserved: 'bg-warning/10 text-warning',
  booked: 'bg-warning/10 text-warning',
  preparing: 'bg-slate-100 text-slate-700',
  on_route: 'bg-blue-100 text-blue-700',
  active_hire: 'bg-primary/10 text-primary',
  returned: 'bg-slate-100 text-slate-700',
  inspection: 'bg-warning/10 text-warning',
  maintenance: 'bg-danger/10 text-danger',
  accident: 'bg-danger/10 text-danger',
  unavailable: 'bg-slate-200 text-slate-600',
  retired: 'bg-slate-200 text-slate-500',
};

export function VehicleListPage() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { has } = usePermissions();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return vehicles;
    return vehicles.filter((v: Vehicle) => {
      return (
        v.registration?.toLowerCase().includes(needle) ||
        v.make?.toLowerCase().includes(needle) ||
        v.model?.toLowerCase().includes(needle) ||
        v.vin?.toLowerCase().includes(needle)
      );
    });
  }, [vehicles, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Vehicles</h1>
        {has('vehicles.manage') && (
          <Link
            to="/vehicles/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus size={16} /> Add Vehicle
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
              placeholder="Search registration, make, model, VIN…"
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {vehicles.length === 0 ? 'No vehicles yet.' : 'No vehicles match your search.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Registration</th>
                <th>Vehicle</th>
                <th>Branch</th>
                <th>Category</th>
                <th>Rate / day</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: Vehicle) => (
                <tr key={v.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-mono">{v.registration}</td>
                  <td>
                    <div className="font-medium text-navy">
                      {v.make} {v.model}
                    </div>
                    <div className="text-xs text-slate-500">
                      {[v.year, v.colour, v.transmission].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td>{v.branches?.name ?? '—'}</td>
                  <td>{v.category ?? '—'}</td>
                  <td>
                    {v.daily_rate
                      ? `$${Number(v.daily_rate).toLocaleString()}`
                      : '—'}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        STATUS_COLOURS[v.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {String(v.status).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-right pr-3">
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="text-primary hover:text-primary-dark text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}