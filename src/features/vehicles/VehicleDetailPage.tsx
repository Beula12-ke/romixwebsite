import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useVehicle, useUpdateVehicle, type VehicleStatus } from './useVehicles';
import { usePermissions } from '@/features/auth/usePermissions';
import { VehicleMediaSection } from './VehicleMediaSection';
import { VehicleDocumentsSection } from './VehicleDocumentsSection';

const STATUSES: VehicleStatus[] = [
  'available','reserved','booked','preparing','on_route','active_hire',
  'returned','inspection','maintenance','accident','unavailable','retired',
];

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const update = useUpdateVehicle();
  const { has } = usePermissions();

  if (isLoading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (error || !vehicle) return <div className="p-6 text-danger">Vehicle not found.</div>;

  const v = vehicle as any;

  const changeStatus = async (status: VehicleStatus) => {
    await update.mutateAsync({ id: v.id, patch: { status } });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/vehicles" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to vehicles
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {v.make} {v.model} {v.year && <span className="text-slate-400 font-normal">· {v.year}</span>}
          </h1>
          <div className="text-sm text-slate-500 font-mono mt-1">{v.registration}</div>
        </div>
        {has('vehicles.manage') && (
          <select
            value={v.status}
            onChange={(e) => changeStatus(e.target.value as VehicleStatus)}
            disabled={update.isPending}
            className="input max-w-[180px]"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Branch" value={(v.branches as any)?.name ?? '—'} />
        <Card label="Category" value={v.category ?? '—'} />
        <Card label="Ownership" value={v.ownership_type} />
        <Card label="Daily rate" value={v.daily_rate ? `$${Number(v.daily_rate).toLocaleString()}` : '—'} />
        <Card label="Mileage" value={`${Number(v.mileage).toLocaleString()} km`} />
        <Card label="Status" value={String(v.status).replace(/_/g, ' ')} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-navy mb-4">Specification</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Item label="VIN" value={v.vin} mono />
          <Item label="Trim" value={v.trim} />
          <Item label="Colour" value={v.colour} />
          <Item label="Fuel" value={v.fuel} />
          <Item label="Transmission" value={v.transmission} />
          <Item label="Seats" value={v.seats} />
        </dl>
      </div>

      {v.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-navy mb-2">Notes</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{v.notes}</p>
        </div>
      )}

      <VehicleMediaSection vehicleId={v.id} branchId={v.branch_id} />
      <VehicleDocumentsSection vehicleId={v.id} branchId={v.branch_id} />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-navy">{value}</div>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: unknown; mono?: boolean }) {
  return (
    <div>
      <dt className="text-slate-500 text-xs uppercase tracking-wide">{label}</dt>
      <dd className={`mt-1 text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>
        {value == null || value === '' ? '—' : String(value)}
      </dd>
    </div>
  );
}