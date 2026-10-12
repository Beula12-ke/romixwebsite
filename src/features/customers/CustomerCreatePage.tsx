import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';
import { useCreateCustomer } from './useCustomers';

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const create = useCreateCustomer();

  const { data: branches = [] } = useQuery({
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
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    national_id: '',
    license_number: '',
    license_expiry: '',
    address: '',
    city: '',
    country: '',
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
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        national_id: form.national_id.trim() || null,
        license_number: form.license_number.trim() || null,
        license_expiry: form.license_expiry || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        notes: form.notes.trim() || null,
      };
      await create.mutateAsync(payload as any);
      navigate('/customers');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to customers
      </Link>

      <h1 className="text-2xl font-bold text-navy">Add Customer</h1>

      {error && <div className="bg-danger/10 text-danger rounded-md p-3 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">First name <span className="text-danger">*</span></label>
              <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name <span className="text-danger">*</span></label>
              <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required className="input" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-danger">*</span></label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} required className="input" placeholder="+254…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">National ID</label>
              <input value={form.national_id} onChange={(e) => set('national_id', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Driving License</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License number</label>
              <input value={form.license_number} onChange={(e) => set('license_number', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License expiry</label>
              <input type="date" value={form.license_expiry} onChange={(e) => set('license_expiry', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Street address</label>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className="input" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Link to="/customers" className="px-4 py-2 text-sm text-slate-600 hover:text-navy">Cancel</Link>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {create.isPending ? 'Creating…' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}