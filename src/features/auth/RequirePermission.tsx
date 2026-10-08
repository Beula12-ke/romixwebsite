import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from './usePermissions';

export function RequirePermission({ permission }: { permission: string }) {
  const { has, loading } = usePermissions();
  if (loading) return <div className="p-8">Loading…</div>;
  if (!has(permission)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
