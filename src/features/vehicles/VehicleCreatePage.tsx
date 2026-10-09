import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';
import { useCreateVehicle } from './useVehicles';

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

const FUEL_OPTIONS = ['petrol', 'diesel', 'electric', 'hybrid', 'other'];
const TRANSMISSION_OPTIONS = ['manual', 'automatic', 'other'];
const OWNERSHIP_OPTIONS = ['company', 'partner', 'leased', 'financed', 'other'];

export function VehicleCreatePage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const create = useCreateVehicle();

  const { data: branches = [] } = useQuery<BranchOption[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('id, name, code').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const defaultBranch = profile?.default_branch_id ?? branches[0]?.id ?? '';

  const [form, setForm] = useState({
    branch_id: defaultBranch,
    registration: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    trim: '',
    colour: '',
    fuel: '',
    transmission: '',
    seats: '',
    mileage: '0',
    category: '',
    ownership_type: 'company',
    daily_rate: '0',
    status: 'available',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        branch_id: form.branch_id,
        registration: form.registration.trim(),
        vin: form.vin.trim() || null,
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        trim: form.trim.trim() || null,
        colour: form.colour.trim() || null,
        fuel: form.fuel || null,
        transmission: form.transmission || null,
        seats: form.seats ? Number(form.seats) : null,
        mileage: form.mileage ? Number(form.mileage) : 0,
        category: form.category.trim() || null,
        ownership_type: form.ownership_type,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : 0,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      const created = await create.mutateAsync(payload as any);
      navigate(`/vehicles/${(created as any).id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create vehicle');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/vehicles" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to vehicles
      </Link>

      <h1 className="text-2xl font-bold text-navy">Add Vehicle</h1>

      {error && <div className="bg-danger/10 text-danger rounded-md p-3 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <Section title="Identity">
          <Field label="Branch" required>
            <select
              value={form.branch_id}
              onChange={(e) => set('branch_id', e.target.value)}
              required
              className="input"
            >
              <option value="">Select branch…</option>
              {branches.map((b: BranchOption) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Registration" required>
            <input value={form.registration} onChange={(e) => set('registration', e.target.value)} required className="input" placeholder="e.g. KDA 123A" />
          </Field>
          <Field label="VIN / Chassis">
            <input value={form.vin} onChange={(e) => set('vin', e.target.value)} className="input" />
          </Field>
        </Section>

        <Section title="Vehicle">
          <Field label="Make" required>
            <input value={form.make} onChange={(e) => set('make', e.target.value)} required className="input" placeholder="e.g. Toyota" />
          </Field>
          <Field label="Model" required>
            <input value={form.model} onChange={(e) => set('model', e.target.value)} required className="input" placeholder="e.g. Corolla" />
          </Field>
          <Field label="Year">
            <input value={form.year} onChange={(e) => set('year', e.target.value)} type="number" className="input" />
          </Field>
          <Field label="Trim">
            <input value={form.trim} onChange={(e) => set('trim', e.target.value)} className="input" />
          </Field>
          <Field label="Colour">
            <input value={form.colour} onChange={(e) => set('colour', e.target.value)} className="input" />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => set('category', e.target.value)} className="input" placeholder="e.g. SUV, Sedan, Van" />
          </Field>
        </Section>

        <Section title="Specs">
          <Field label="Fuel">
            <select value={form.fuel} onChange={(e) => set('fuel', e.target.value)} className="input">
              <option value="">—</option>
              {FUEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Transmission">
            <select value={form.transmission} onChange={(e) => set('transmission', e.target.value)} className="input">
              <option value="">—</option>
              {TRANSMISSION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Seats">
            <input value={form.seats} onChange={(e) => set('seats', e.target.value)} type="number" className="input" />
          </Field>
          <Field label="Mileage (km)">
            <input value={form.mileage} onChange={(e) => set('mileage', e.target.value)} type="number" className="input" />
          </Field>
        </Section>

        <Section title="Commercial">
          <Field label="Ownership">
            <select value={form.ownership_type} onChange={(e) => set('ownership_type', e.target.value)} className="input">
              {OWNERSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Daily rate">
            <input value={form.daily_rate} onChange={(e) => set('daily_rate', e.target.value)} type="number" step="0.01" className="input" />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
              <option value="available">available</option>
              <option value="preparing">preparing</option>
              <option value="maintenance">maintenance</option>
              <option value="unavailable">unavailable</option>
            </select>
          </Field>
        </Section>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className="input" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Link to="/vehicles" className="px-4 py-2 text-sm text-slate-600 hover:text-navy">Cancel</Link>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {create.isPending ? 'Creating…' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}