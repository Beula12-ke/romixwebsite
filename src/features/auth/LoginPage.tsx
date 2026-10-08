import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-lg shadow p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Romix Website</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
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
      </form>
    </div>
  );
}
