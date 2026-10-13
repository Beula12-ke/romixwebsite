import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const registered = params.get('registered') === '1';
  const pending = params.get('pending') === '1';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }

    const uid = data.user?.id;
    if (!uid) {
      setLoading(false);
      return setError('Sign-in failed. Please try again.');
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', uid)
      .maybeSingle();

    const roleName = (prof?.roles as any)?.name as string | undefined;
    setLoading(false);

    if (roleName === 'customer') {
      navigate('/my/bookings');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-lg shadow p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Romix Website</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        {registered && (
          <div className="text-sm text-success bg-success/10 rounded-md p-3">
            {pending
              ? 'Account created. Check your email to confirm, then sign in.'
              : 'Account created successfully. Please sign in.'}
          </div>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-500 pt-2">
          New here? <Link to="/register" className="text-primary hover:text-primary-dark font-medium">Create an account</Link>
        </p>
      </form>
    </div>
  );
}