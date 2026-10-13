import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function PaymentReceiptPage() {
  const { id } = useParams<{ id: string }>();

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings(
            id, pickup_at, return_at, days, daily_rate, subtotal, extras, tax, deposit, total,
            customers(first_name, last_name, phone, email),
            vehicles(make, model, registration, year),
            pickup_branch:branches!bookings_pickup_branch_id_fkey(name, code, address)
          )
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (error || !payment) return <div className="p-6 text-danger">Receipt not found.</div>;

  const p = payment as any;
  const b = p.bookings;
  const customer = b?.customers;
  const vehicle = b?.vehicles;

  const receiptNumber = `R-${p.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/bookings/${b?.id ?? ''}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy"
        >
          <ArrowLeft size={16} /> Back to booking
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-10 print:shadow-none">
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <div className="text-2xl font-bold text-navy">Romix Website</div>
            <div className="text-xs text-slate-500 mt-1">Car Hire Solutions</div>
            <div className="text-xs text-slate-500">Your Journey. Our Priority.</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">Receipt</div>
            <div className="font-mono text-navy font-semibold mt-1">{receiptNumber}</div>
            <div className="text-xs text-slate-500 mt-1">{fmt(p.paid_at)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 border-b">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Billed To</div>
            <div className="text-navy font-semibold">
              {customer ? `${customer.first_name} ${customer.last_name}` : '—'}
            </div>
            {customer?.phone && <div className="text-sm text-slate-600 mt-1">{customer.phone}</div>}
            {customer?.email && <div className="text-sm text-slate-600">{customer.email}</div>}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Branch</div>
            <div className="text-navy font-semibold">{b?.pickup_branch?.name ?? '—'}</div>
            {b?.pickup_branch?.address && (
              <div className="text-sm text-slate-600 mt-1">{b.pickup_branch.address}</div>
            )}
          </div>
        </div>

        <div className="py-6 border-b">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">Vehicle</div>
          <div className="flex items-start justify-between text-sm">
            <div>
              <div className="text-navy font-semibold">
                {vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year ?? ''}` : '—'}
              </div>
              {vehicle?.registration && (
                <div className="text-slate-500 font-mono text-xs mt-1">{vehicle.registration}</div>
              )}
            </div>
            <div className="text-right text-slate-500 text-xs">
              <div>Pickup: {fmt(b?.pickup_at)}</div>
              <div>Return: {fmt(b?.return_at)}</div>
            </div>
          </div>
        </div>

        <div className="py-6">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr>
                <th className="py-2">Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  {b?.days} day{b?.days > 1 ? 's' : ''} rental @ ${Number(b?.daily_rate ?? 0).toLocaleString()} / day
                </td>
                <td className="text-right font-mono">${Number(b?.subtotal ?? 0).toLocaleString()}</td>
              </tr>
              {Number(b?.extras ?? 0) > 0 && (
                <tr className="border-b">
                  <td className="py-3">Extras</td>
                  <td className="text-right font-mono">${Number(b.extras).toLocaleString()}</td>
                </tr>
              )}
              {Number(b?.tax ?? 0) > 0 && (
                <tr className="border-b">
                  <td className="py-3">Tax</td>
                  <td className="text-right font-mono">${Number(b.tax).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Rental total</span>
              <span className="font-mono">${Number(b?.total ?? 0).toLocaleString()}</span>
            </div>
            {Number(b?.deposit ?? 0) > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Deposit held</span>
                <span className="font-mono">${Number(b.deposit).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t-2 font-semibold text-navy text-base">
              <span>Payment received</span>
              <span className="font-mono">${Number(p.amount).toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500 capitalize text-right">
              via {p.method.replace(/_/g, ' ')}
              {p.reference && ` · ref ${p.reference}`}
            </div>
          </div>
        </div>

        <div className="border-t pt-6 text-center text-xs text-slate-500 space-y-1">
          <div className="text-navy font-medium">Thank you for choosing Romix Website</div>
          <div>This is a computer-generated receipt. Keep it for your records.</div>
          {p.notes && <div className="italic mt-2">{p.notes}</div>}
        </div>
      </div>
    </div>
  );
}