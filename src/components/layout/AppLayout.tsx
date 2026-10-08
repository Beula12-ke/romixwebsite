import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, ScrollText, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/auth/useProfile';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/branches', label: 'Branches', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-full flex bg-slate-50">
      <aside className="w-60 bg-navy text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-bold">Romix Website</div>
          <div className="text-xs text-white/60">Your Journey. Our Priority.</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  isActive ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10'
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-sm">{profile?.full_name || profile?.email || 'User'}</div>
          <button
            onClick={logout}
            className="mt-2 flex items-center gap-2 text-xs text-white/70 hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
