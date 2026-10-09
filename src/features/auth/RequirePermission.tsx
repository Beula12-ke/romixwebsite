import { Outlet, useLocation } from 'react-router-dom';
import { usePermissions } from './usePermissions';

export function RequirePermission({ permission }: { permission: string }) {
  const { has, loading } = usePermissions();
  const location = useLocation();

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!has(permission)) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-navy">Access denied</h2>
        <p className="text-slate-500 text-sm mt-2">
          You don't have permission to view this page ({permission}).
        </p>
        <p className="text-xs text-slate-400 mt-4">Route: {location.pathname}</p>
      </div>
    );
  }
  return <Outlet />;
}