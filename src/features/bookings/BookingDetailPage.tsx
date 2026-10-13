import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Car,
  Phone,
  Mail,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBooking } from './useBookings';
import { usePermissions } from '@/features/auth/usePermissions';
import { BookingPaymentsSection } from '@/features/payments/BookingPaymentsSection';

const STATUS_COLOURS: Record<string, string> = {
  enquiry: 'bg-slate-100 text-slate-700',
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-blue-100 text-blue-700',
  ready: 'bg-blue-100 text-blue-700',
  dispatched: 'bg-primary/10 text-primary',
  active_hire: 'bg-primary/10 text-primary',
  returned: 'bg-slate-100 text-slate-700',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
  no_show: 'bg-danger/10 text-danger',
};

type Action = {
  label: string;
  next: string;
  icon: React.ElementType;
  variant: 'primary' | 'success' | 'danger' | 'neutral';
  showFor: string[];
};

const ACTIONS: Action[] = [
  { label: 'Confirm', next: 'confirmed', icon: CheckCircle2, variant: 'primary', showFor: ['enquiry', 'pending'] },
  { label: 'Mark Ready', next: 'ready', icon: CheckCircle2, variant: 'primary', showFor: ['confirmed'] },
  { label: 'Dispatch', next: 'dispatched', icon: PlayCircle, variant: 'primary', showFor: ['ready'] },
  { label: 'Start Hire', next: 'active_hire', icon: PlayCircle, variant: 'primary', showFor: ['dispatched'] },
  { label: 'Return', next: 'returned', icon: RotateCcw, variant: 'primary', showFor: ['active_hire'] },
  { label: 'Complete', next: 'completed', icon: CheckCircle2, variant: 'success', showFor: ['returned'] },
  { label: 'Cancel', next: 'cancelled', icon: XCircle, variant: 'danger', showFor: ['enquiry', 'pending', 'confirmed', 'ready'] },
  { label: 'No-Show', next: 'no_show', icon: AlertTriangle, variant: 'danger', showFor: ['ready', 'dispatched'] },
];

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const variantClass: Record<Action['variant'], string> = {
  primary: 'bg-primary hover:bg-primary-dark text-white',
  success: 'bg-success hover:bg-success/90 text-white',
  danger: 'bg-danger hover:bg-danger/90 text-white',
  neutral: 'bg-slate-200 hover:bg-slate-300 text-slate-800',
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, error } = useBooking(id);
  const qc = useQueryClient();
  const { has } = usePermissions();

  if (isLoading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (error || !booking) return <div className="p-6 text-danger">Booking not found.</div>;

  const b = booking as any;
  const canManage = has('bookings.manage');

  const runTransition = async (next: string, label: string) => {
    if (!confirm(`${label}?`)) return;
    try {
      const { error: rpcErr } = await supabase.rpc('transition_booking', {
        p_booking_id: b.id,
        p_new_status: next,
      });
      if (rpcErr) throw rpcErr;
      await qc.invalidateQueries({ queryKey: ['bookings'] });
      await qc.invalidateQueries({ queryKey: ['bookings', b.id] });
      await qc.invalidateQueries({ queryKey: ['vehicles'] });
      await qc.invalidateQueries({ queryKey: ['availability'] });
    } catch (err: any) {
      alert(err?.message ?? 'Transition failed');
    }
  };

  const availableActions = ACTIONS.filter((a) => a.showFor.includes(b.status));

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to bookings
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : 'Booking'}
          </h1>
          <div className="text-sm text-slate-500 font-mono mt-1">
            #{b.id.slice(0, 8)}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            STATUS_COLOURS[b.status] ?? 'bg-slate-100 text-slate-700'
          }`}
        >
          {String(b.status).replace(/_/g, ' ')}
        </span>
      </div>

      {canManage && availableActions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">Actions</div>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.next}
                  type="button"
                  onClick={() => runTransition(a.next, a.label)}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${variantClass[a.variant]}`}
                >
                  <Icon size={16} /> {a.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Customer" icon={User}>
          <div className="space-y-2 text-sm">
            <div className="font-medium text-navy">
              {b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : '—'}
            </div>
            {b.customers?.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} /> {b.customers.phone}
              </div>
            )}
            {b.customers?.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} /> {b.customers.email}
              </div>
            )}
          </div>
        </Card>

        <Card title="Vehicle" icon={Car}>
          {b.vehicles ? (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-navy">
                {b.vehicles.make} {b.vehicles.model} {b.vehicles.year ?? ''}
              </div>
              <div className="font-mono text-xs text-slate-500">
                {b.vehicles.registration}
              </div>
              <Link
                to={`/vehicles/${b.vehicles.id}`}
                className="text-primary text-xs hover:text-primary-dark inline-block"
              >
                View vehicle →
              </Link>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No vehicle assigned</div>
          )}
        </Card>

        <Card title="Pickup" icon={Calendar}>
          <div className="space-y-2 text-sm">
            <div className="text-navy font-medium">{fmt(b.pickup_at)}</div>
            {b.pickup_branch && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} /> {(b.pickup_branch as any).name}
              </div>
            )}
          </div>
        </Card>

        <Card title="Return" icon={Calendar}>
          <div className="space-y-2 text-sm">
            <div className="text-navy font-medium">{fmt(b.return_at)}</div>
            <div className="text-slate-500 text-xs">
              {b.days} day{b.days > 1 ? 's' : ''}
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-navy mb-4">Pricing</h2>
        <div className="space-y-2 text-sm">
          <Row label={`${b.days} day${b.days > 1 ? 's' : ''} × $${Number(b.daily_rate).toLocaleString()}`} value={`$${Number(b.subtotal).toLocaleString()}`} />
          {Number(b.extras) > 0 && <Row label="Extras" value={`$${Number(b.extras).toLocaleString()}`} />}
          {Number(b.tax) > 0 && <Row label="Tax" value={`$${Number(b.tax).toLocaleString()}`} />}
          {Number(b.deposit) > 0 && <Row label="Deposit held" value={`$${Number(b.deposit).toLocaleString()}`} muted />}
          <div className="flex justify-between pt-3 border-t font-semibold text-navy text-base">
            <span>Total</span>
            <span>${Number(b.total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <BookingPaymentsSection
        bookingId={b.id}
        branchId={b.branch_id}
        total={Number(b.total)}
      />

      {b.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-navy mb-2">Customer notes</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{b.notes}</p>
        </div>
      )}

      {b.internal_notes && (
        <div className="bg-warning/5 border border-warning/30 rounded-lg p-6">
          <h2 className="font-semibold text-warning mb-2">Internal notes</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{b.internal_notes}</p>
        </div>
      )}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 mb-3">
        <Icon size={14} /> {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-slate-500' : 'text-slate-700'}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}