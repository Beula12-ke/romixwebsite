import { useProfile } from '@/features/auth/useProfile';

export function BranchDashboard() {
  const { data: profile } = useProfile();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Branch Dashboard</h1>
      <p className="text-slate-500">
        Signed in as <strong>{profile?.full_name ?? profile?.email ?? 'User'}</strong> · Branch:{' '}
        <strong>{profile?.branch_name ?? '—'}</strong>
      </p>
      <div className="bg-white rounded-lg shadow p-6 text-sm text-slate-500">
        Bookings, dispatch/return, and fleet widgets arrive in Phase 4+.
      </div>
    </div>
  );
}