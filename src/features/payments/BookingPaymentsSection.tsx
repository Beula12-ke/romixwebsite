import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Receipt } from 'lucide-react';
import {
  useBookingPayments,
  useRecordPayment,
  useDeletePayment,
  useTotalPaidForBooking,
  type PaymentMethod,
} from './usePayments';
import { usePermissions } from '@/features/auth/usePermissions';

const METHODS: PaymentMethod[] = ['cash', 'card', 'mpesa', 'bank_transfer', 'cheque', 'other'];

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function BookingPaymentsSection({
  bookingId,
  branchId,
  total,
}: {
  bookingId: string;
  branchId: string;
  total: number;
}) {
  const { data: payments = [], isLoading } = useBookingPayments(bookingId);
  const { total: totalPaid } = useTotalPaidForBooking(bookingId);
  const record = useRecordPayment();
  const del = useDeletePayment();
  const { has } = usePermissions();

  const canManage = has('payments.manage') || has('bookings.manage');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    method: 'cash' as PaymentMethod,
    reference: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const outstanding = Math.max(0, Number(total) - totalPaid);
  const percent = total > 0 ? Math.min(100, (totalPaid / Number(total)) * 100) : 0;

  const statusLabel = useMemo(() => {
    if (totalPaid <= 0) return { text: 'Unpaid', cls: 'text-slate-500 bg-slate-100' };
    if (totalPaid >= Number(total)) return { text: 'Paid in full', cls: 'text-success bg-success/10' };
    return { text: 'Partial', cls: 'text-warning bg-warning/10' };
  }, [totalPaid, total]);

  const reset = () => {
    setForm({ amount: '', method: 'cash', reference: '', notes: '' });
    setError(null);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setError('Enter a positive amount');
    try {
      await record.mutateAsync({
        bookingId,
        branchId,
        amount: amt,
        method: form.method,
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null,
      });
      reset();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record payment');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-navy">Payments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ${totalPaid.toLocaleString()} of ${Number(total).toLocaleString()} collected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusLabel.cls}`}>
            {statusLabel.text}
          </span>
          {canManage && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark"
            >
              <Plus size={14} /> Record payment
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-b bg-slate-50">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>Progress</span>
          <span>
            {percent.toFixed(0)}% · outstanding ${outstanding.toLocaleString()}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="p-6 border-b bg-slate-50 space-y-3">
          {error && <div className="text-sm text-danger bg-danger/10 rounded-md p-2">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="input"
                placeholder={outstanding > 0 ? String(outstanding) : '0.00'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
                className="input"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reference</label>
              <input
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                className="input"
                placeholder="e.g. M-Pesa code, card ref"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={reset} className="text-sm text-slate-600 hover:text-navy px-3 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={record.isPending}
              className="bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {record.isPending ? 'Saving…' : 'Save payment'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="p-6 text-slate-500 text-sm">Loading payments…</div>
      ) : payments.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-sm">
          No payments recorded yet.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="px-6 py-2">Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-6 py-3 text-xs">{fmt(p.paid_at)}</td>
                <td className="font-mono">${Number(p.amount).toLocaleString()}</td>
                <td className="capitalize">{p.method.replace(/_/g, ' ')}</td>
                <td className="text-slate-500 text-xs">{p.reference ?? '—'}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    p.status === 'succeeded' ? 'bg-success/10 text-success' :
                    p.status === 'pending' ? 'bg-warning/10 text-warning' :
                    p.status === 'refunded' ? 'bg-slate-100 text-slate-600' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="text-right pr-6">
                  <Link
                    to={`/payments/${p.id}/receipt`}
                    className="text-primary hover:text-primary-dark text-xs inline-flex items-center gap-1"
                    title="View receipt"
                  >
                    <Receipt size={14} /> Receipt
                  </Link>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this payment record?')) {
                          del.mutate({ id: p.id, booking_id: p.booking_id });
                        }
                      }}
                      className="text-danger hover:text-danger/80 p-1 ml-3"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}