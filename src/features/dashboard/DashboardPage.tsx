import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Car, CalendarCheck, DollarSign, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';

const STATUS_COLOURS_HEX: Record<string, string> = {
  available: '#16a34a',
  booked: '#2563eb',
  on_route: '#e11d2e',
  active_hire: '#0b1f3a',
  maintenance: '#f59e0b',
  inspection: '#f59e0b',
  other: '#94a3b8',
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export function DashboardPage() {
  const vehiclesQ = useQuery({
    queryKey: ['dash_vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('id, status, category, daily_rate, is_active');
      if (error) throw error;
      return data ?? [];
    },
  });

  const bookingsQ = useQuery({
    queryKey: ['dash_bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, total, created_at, branch_id, pickup_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const paymentsQ = useQuery({
    queryKey: ['dash_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, paid_at, status')
        .eq('status', 'succeeded')
        .gte('paid_at', daysAgo(30).toISOString())
        .order('paid_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const recentQ = useQuery({
    queryKey: ['dash_recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, total, pickup_at, customers(first_name, last_name), vehicles(make, model, registration)')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const branchesQ = useQuery({
    queryKey: ['dash_branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('id, name');
      if (error) throw error;
      return data ?? [];
    },
  });

  if (vehiclesQ.isLoading || bookingsQ.isLoading || paymentsQ.isLoading) {
    return <div className="p-8 text-slate-500">Loading dashboard…</div>;
  }

  if (vehiclesQ.error || bookingsQ.error || paymentsQ.error) {
    return (
      <div className="p-8">
        <h2 className="text-danger font-bold">Dashboard error</h2>
        <p className="text-sm text-slate-600 mt-2">
          {String((vehiclesQ.error as any)?.message ?? (bookingsQ.error as any)?.message ?? (paymentsQ.error as any)?.message)}
        </p>
      </div>
    );
  }

  const vehicles = vehiclesQ.data ?? [];
  const bookings = bookingsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const recentBookings = recentQ.data ?? [];
  const branches = branchesQ.data ?? [];

  const branchNameMap = new Map(branches.map((b: any) => [b.id, b.name]));

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v: any) => v.is_active).length;
  const activeBookings = bookings.filter((b: any) =>
    ['confirmed', 'ready', 'dispatched', 'active_hire'].includes(b.status),
  ).length;
  const revenue30 = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const utilization = totalVehicles > 0
    ? (vehicles.filter((v: any) => v.status === 'active_hire').length / totalVehicles) * 100
    : 0;

  const statusCounts = vehicles.reduce<Record<string, number>>((acc, v: any) => {
    const key = ['available', 'booked', 'on_route', 'active_hire', 'maintenance', 'inspection'].includes(v.status)
      ? v.status
      : 'other';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const statusPieData = Object.entries(statusCounts).map(([k, v]) => ({
    name: k.replace(/_/g, ' '),
    value: v,
    colour: STATUS_COLOURS_HEX[k] ?? '#94a3b8',
  }));

  const revenueByDay = (() => {
    const out: { date: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgo(i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const sum = payments
        .filter((p: any) => {
          const t = new Date(p.paid_at).getTime();
          return t >= d.getTime() && t < next.getTime();
        })
        .reduce((s: number, p: any) => s + Number(p.amount), 0);
      out.push({ date: fmtDateShort(d.toISOString()), revenue: sum });
    }
    return out;
  })();

  const fleetByCategory = (() => {
    const map: Record<string, number> = {};
    vehicles.forEach((v: any) => {
      const key = v.category ?? 'Uncategorised';
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const branchPerf = (() => {
    const map: Record<string, { name: string; bookings: number; revenue: number }> = {};
    bookings.forEach((b: any) => {
      const key = b.branch_id;
      const name = branchNameMap.get(key) ?? '—';
      if (!map[key]) map[key] = { name, bookings: 0, revenue: 0 };
      map[key].bookings += 1;
      if (['completed', 'returned', 'active_hire'].includes(b.status)) {
        map[key].revenue += Number(b.total ?? 0);
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of fleet, bookings and revenue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vehicles" value={totalVehicles} sub={`${activeVehicles} active`} icon={Car} accent="blue" />
        <StatCard label="Active Bookings" value={activeBookings} sub="Confirmed or in-hire" icon={CalendarCheck} accent="green" />
        <StatCard label="Revenue (30d)" value={fmtMoney(revenue30)} sub="Succeeded payments" icon={DollarSign} accent="red" />
        <StatCard label="Fleet Utilization" value={`${utilization.toFixed(0)}%`} sub={`${vehicles.filter((v: any) => v.status === 'active_hire').length} of ${totalVehicles} on hire`} icon={TrendingUp} accent="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-navy mb-4">Revenue · last 14 days</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={revenueByDay} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(Number(v))} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#e11d2e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-navy mb-4">Vehicle status</h2>
          {statusPieData.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-16">No vehicles yet.</div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {statusPieData.map((d, i) => <Cell key={i} fill={d.colour} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-navy mb-4">Fleet by category</h2>
          {fleetByCategory.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-16">No vehicles yet.</div>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={fleetByCategory} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#0b1f3a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-navy">Branch performance</h2>
          </div>
          {branchPerf.length === 0 ? (
            <div className="p-6 text-slate-400 text-sm text-center">No bookings yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-2">Branch</th>
                  <th className="text-right">Bookings</th>
                  <th className="text-right pr-6">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {branchPerf.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-6 py-3 font-medium text-navy">{r.name}</td>
                    <td className="text-right">{r.bookings}</td>
                    <td className="text-right pr-6 font-mono">${r.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-navy">Recent bookings</h2>
          <Link to="/bookings" className="text-sm text-primary hover:text-primary-dark">View all →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-6 text-slate-400 text-sm text-center">No bookings yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-2">Customer</th>
                <th>Vehicle</th>
                <th>Pickup</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b: any) => (
                <tr key={b.id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link to={`/bookings/${b.id}`} className="font-medium text-navy hover:text-primary">
                      {b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : '—'}
                    </Link>
                  </td>
                  <td>
                    {b.vehicles ? (
                      <>
                        <div className="text-navy">{b.vehicles.make} {b.vehicles.model}</div>
                        <div className="text-xs text-slate-500 font-mono">{b.vehicles.registration}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td className="text-xs text-slate-600">
                    {new Date(b.pickup_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="font-mono">${Number(b.total).toLocaleString()}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 capitalize">
                      {String(b.status).replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const ACCENTS = {
  red: { bg: 'bg-primary/5', icon: 'text-primary' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-success/5', icon: 'text-success' },
  orange: { bg: 'bg-warning/5', icon: 'text-warning' },
};

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: keyof typeof ACCENTS;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center`}>
        <Icon size={20} className={a.icon} />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-navy">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}