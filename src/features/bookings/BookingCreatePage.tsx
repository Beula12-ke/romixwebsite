import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';
import { useCustomers } from '@/features/customers/useCustomers';
import { useCreateBooking } from './useBookings';
import { useAvailability } from './useAvailability';

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function BookingCreatePage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: customers = [] } = useCustomers();
  const create = useCreateBooking();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('id, name, code').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const defaultBranch = profile?.default_branch_id ?? branches[0]?.id ?? '';

  const [form, setForm] = useState({
    branch_id: defaultBranch,
    customer_id: '',
    vehicle_id: '',
    pickup_branch_id: defaultBranch,
    return_branch_id: defaultBranch,
    pickup_at: toLocalInput(tomorrow),
    return_at: toLocalInput(dayAfter),
    daily_rate: '0',
    deposit: '0',
    extras: '0',
    tax: '0',
    notes: '',
    internal_notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const days = useMemo(() => {
    const p = new Date(form.pickup_at).getTime();
    const r = new Date(form.return_at).getTime();
    if (!p || !r || r <= p) return 0;
    return Math.max(1, Math.ceil((r - p) / (1000 * 60 * 60 * 24)));
  }, [form.pickup_at, form.return_at]);

  const subtotal = useMemo(() => days * Number(form.daily_rate || 0), [days, form.daily_rate]);
  const total = useMemo(
    () =>
      subtotal +
      Number(form.extras || 0) +
      Number(form.tax || 0),
    [subtotal, form.extras, form.tax],
  );

  const availability = useAvailability(
    form.pickup_branch_id || null,
    form.pickup_at ? toIso(form.pickup_at) : null,
    form.return_at ? toIso(form.return_at) : null,
  );

  useEffect(() => {
    if (!form.vehicle_id) return;
    const stillAvailable = (availability.data ?? []).some((v) => v.id === form.vehicle_id);
    if (!stillAvailable) {
      setForm((f) => ({ ...f, vehicle_id: '' }));
    }
  }, [availability.data, form.vehicle_id]);

  const selectedVehicle = useMemo(
    () => (availability.data ?? []).find((v) => v.id === form.vehicle_id),
    [availability.data, form.vehicle_id],
  );

  useEffect(() => {
    if (selectedVehicle && Number(selectedVehicle.daily_rate) > 0) {
      setForm((f) => ({ ...f, daily_rate: String(selectedVehicle.daily_rate) }));
    }
  }, [selectedVehicle]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.customer_id) return setError('Choose a customer');
    if (!form.vehicle_id) return setError('Choose an available vehicle');
    if (days <= 0) return setError('Return must be after pickup');
    try {
      const payload = {
        branch_id: form.branch_id,
        customer_id: form.customer_id,
        vehicle_id: form.vehicle_id,
        pickup_branch_id: form.pickup_branch_id,
        return_branch_id: form.return_branch_id,
        pickup_at: toIso(form.pickup_at),
        return_at: toIso(form.return_at),
        status: 'confirmed',
        daily_rate: Number(form.daily_rate || 0),
        days,
        subtotal,
        extras: Number(form.extras || 0),
        deposit: Number(form.deposit || 0),
        tax: Number(form.tax || 0),
        total,
        notes: form.notes.trim() || null,
        internal_notes: form.internal_notes.trim() || null,
      };
      await create.mutateAsync(payload as any);
      navigate('/bookings');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create booking');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to bookings
      </Link>

      <h1 className="text-2xl font-bold text-navy">New Booking</h1>

      {error && <div className="bg-danger/10 text-danger rounded-md p-3 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Customer & Branch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch <span className="text-danger">*</span></label>
              <select value={form.branch_id} onChange={(e) => set('branch_id', e.target.value)} required className="input">
                <option value="">Select branch…</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer <span className="text-danger">*</span></label>
              <select value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)} required className="input">
                <option value="">Select customer…</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} · {c.phone}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No customers yet. <Link to="/customers/new" className="text-primary">Add one</Link>.
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Dates & Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pickup at <span className="text-danger">*</span></label>
              <input type="datetime-local" value={form.pickup_at} onChange={(e) => set('pickup_at', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Return at <span className="text-danger">*</span></label>
              <input type="datetime-local" value={form.return_at} onChange={(e) => set('return_at', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pickup branch <span className="text-danger">*</span></label>
              <select value={form.pickup_branch_id} onChange={(e) => set('pickup_branch_id', e.target.value)} required className="input">
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Return branch <span className="text-danger">*</span></label>
              <select value={form.return_branch_id} onChange={(e) => set('return_branch_id', e.target.value)} required className="input">
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">
            Vehicle · {days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Pick dates first'}
          </h2>

          {days <= 0 ? (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-md p-4">
              Choose valid pickup and return dates to see available vehicles.
            </div>
          ) : availability.isLoading ? (
            <div className="text-sm text-slate-500 p-4">Checking availability…</div>
          ) : (availability.data ?? []).length === 0 ? (
            <div className="text-sm text-warning bg-warning/10 rounded-md p-4">
              No vehicles available at {branches.find((b: any) => b.id === form.pickup_branch_id)?.name} for these dates.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(availability.data ?? []).map((v) => {
                const selected = form.vehicle_id === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => set('vehicle_id', v.id)}
                    className={`text-left rounded-md border p-3 transition ${
                      selected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-navy">
                          {v.make} {v.model}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{v.registration}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {v.year ?? '—'} · {v.category ?? '—'}
                        </div>
                      </div>
                      {selected && <CheckCircle2 size={18} className="text-primary shrink-0" />}
                    </div>
                    <div className="text-sm font-semibold text-navy mt-2">
                      ${Number(v.daily_rate).toLocaleString()}<span className="text-xs font-normal text-slate-500"> / day</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily rate</label>
              <input type="number" step="0.01" value={form.daily_rate} onChange={(e) => set('daily_rate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Extras</label>
              <input type="number" step="0.01" value={form.extras} onChange={(e) => set('extras', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax</label>
              <input type="number" step="0.01" value={form.tax} onChange={(e) => set('tax', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deposit</label>
              <input type="number" step="0.01" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} className="input" />
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-600">
            Subtotal: <strong className="text-navy">${subtotal.toLocaleString()}</strong>
            {' · '}
            Total: <strong className="text-navy">${total.toLocaleString()}</strong>
            {' · '}
            Deposit held: <strong className="text-navy">${Number(form.deposit || 0).toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Internal notes</label>
            <textarea value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} rows={3} className="input" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Link to="/bookings" className="px-4 py-2 text-sm text-slate-600 hover:text-navy">Cancel</Link>
          <button
            type="submit"
            disabled={create.isPending || !form.vehicle_id || !form.customer_id}
            className="bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {create.isPending ? 'Creating…' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}