import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';

export function MyProfilePage() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  const { data: customer, isLoading } = useQuery({
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

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setForm({
        first_name: customer.first_name ?? '',
        last_name: customer.last_name ?? '',
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        city: customer.city ?? '',
        country: customer.country ?? '',
      });
    }
  }, [customer]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from('customers')
        .update({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
        })
        .eq('id', customer.id);
      if (upErr) throw upErr;
      await qc.invalidateQueries({ queryKey: ['my_customer'] });
      await qc.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
    } catch (err: any) {
      setError(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-navy">My Profile</h1>

      {error && <div className="text-sm text-danger bg-danger/10 rounded-md p-3">{error}</div>}
      {saved && <div className="text-sm text-success bg-success/10 rounded-md p-3">Profile updated.</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
            <input required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
            <input required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
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

        <div className="flex justify-end pt-2 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}