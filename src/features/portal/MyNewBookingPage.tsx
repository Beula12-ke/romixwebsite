import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';
import { useAvailability } from '@/features/bookings/useAvailability';
import { useCreateBooking } from '@/features/bookings/useBookings';

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function MyNewBookingPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const create = useCreateBooking();

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['my_customer', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

  const defaultBranch = customer?.branch_id ?? branches[0]?.id ?? '';

  const [form, setForm] = useState({
    pickup_branch_id: defaultBranch,
    return_branch_id: defaultBranch,
    pickup_at: toLocalInput(tomorrow),
    return_at: toLocalInput(dayAfter),
    vehicle_id: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultBranch && !form.pickup_branch_id) {
      setForm((f) => ({ ...f, pickup_branch_id: defaultBranch, return_branch_id: defaultBranch }));
    }
  }, [defaultBranch]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const days = useMemo(() => {
    const p = new Date(form.pickup_at).getTime();
    const r = new Date(form.return_at).getTime();
    if (!p || !r || r <= p) return 0;
    return Math.max(1, Math.ceil((r - p) / (1000 * 60 * 60 * 24)));
  }, [form.pickup_at, form.return_at]);

  const availability = useAvailability(
    form.pickup_branch_id || null,
    form.pickup_at ? toIso(form.pickup_at) : null,
    form.return_at ? toIso(form.return_at) : null,
  );

  const selectedVehicle = useMemo(
    () => (availability.data ?? []).find((v) => v.id === form.vehicle_id),
    [availability.data, form.vehicle_id],
  );

  const subtotal = days * Number(selectedVehicle?.daily_rate ?? 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customer) return setError('Customer record not found.');
    if (!form.vehicle_id) return setError('Choose a vehicle');
    if (days <= 0) return setError('Return must be after pickup');
    try {
      const payload = {
        branch_id: form.pickup_branch_id,
        customer_id: customer.id,
        vehicle_id: form.vehicle_id,
        pickup_branch_id: form.pickup_branch_id,
        return_branch_id: form.return_branch_id,
        pickup_at: toIso(form.pickup_at),
        return_at: toIso(form.return_at),
        status: 'pending',
        daily_rate: Number(selectedVehicle?.daily_rate ?? 0),
        days,
        subtotal,
        extras: 0,
        deposit: 0,
        tax: 0,
        total: subtotal,
        notes: form.notes.trim() || null,
        internal_notes: null,
      };
      await create.mutateAsync(payload as any);
      navigate('/my/bookings');
    } catch (err: any) {
      setError(err?.message ?? 'Booking failed');
    }
  };

  if (customerLoading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/my/bookings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to my bookings
      </Link>

      <h1 className="text-2xl font-bold text-navy">Book a Vehicle</h1>

      {error && <div className="bg-danger/10 text-danger rounded-md p-3 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
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
                <option value="">Select branch…</option>
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
            Available Vehicles · {days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Pick dates first'}
          </h2>

          {days <= 0 ? (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-md p-4">
              Choose valid pickup and return dates to see available vehicles.
            </div>
          ) : availability.isLoading ? (
            <div className="text-sm text-slate-500 p-4">Checking availability…</div>
          ) : (availability.data ?? []).length === 0 ? (
            <div className="text-sm text-warning bg-warning/10 rounded-md p-4">
              No vehicles available for these dates at this branch.
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

        {selectedVehicle && (
          <div className="bg-slate-50 rounded-md p-4 space-y-1 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={14} /> {days} day{days > 1 ? 's' : ''} × ${Number(selectedVehicle.daily_rate).toLocaleString()} per day
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-slate-500">Estimated total</span>
              <span className="text-navy font-bold text-lg">${subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Final price confirmed at pickup. Payment on collection.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className="input" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Link to="/my/bookings" className="px-4 py-2 text-sm text-slate-600 hover:text-navy">Cancel</Link>
          <button
            type="submit"
            disabled={create.isPending || !form.vehicle_id}
            className="bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {create.isPending ? 'Booking…' : 'Book Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}