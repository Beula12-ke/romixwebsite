import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: `${form.first_name} ${form.last_name}`.trim(),
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone: form.phone.trim(),
            intended_role: 'customer',
          },
        },
      });
      if (signupError) throw signupError;

      if (!data.session) {
        navigate('/login?registered=1&pending=1');
      } else {
        await supabase.auth.signOut();
        navigate('/login?registered=1');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-lg shadow p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Rent vehicles with Romix Website</p>
        </div>

        {error && <div className="text-sm text-danger bg-danger/10 rounded-md p-3">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">First name</label>
            <input
              required
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Last name</label>
            <input
              required
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
          <input
            required
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+254…"
            className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirm</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-500 pt-2">
          Already have an account? <Link to="/login" className="text-primary hover:text-primary-dark font-medium">Sign in</Link>
        </p>
      </form>
    </div>
  );
}