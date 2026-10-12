import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Mail } from 'lucide-react';
import { useCustomers } from './useCustomers';
import { usePermissions } from '@/features/auth/usePermissions';

export function CustomerListPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const { has } = usePermissions();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((c: any) => {
      const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      return (
        fullName.includes(needle) ||
        c.phone?.toLowerCase().includes(needle) ||
        c.email?.toLowerCase().includes(needle) ||
        c.license_number?.toLowerCase().includes(needle) ||
        c.national_id?.toLowerCase().includes(needle)
      );
    });
  }, [customers, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Customers</h1>
        {has('customers.manage') && (
          <Link
            to="/customers/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus size={16} /> Add Customer
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, email, license…"
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {customers.length === 0 ? 'No customers yet.' : 'No customers match your search.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Name</th>
                <th>Contact</th>
                <th>License</th>
                <th>Branch</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium text-navy">
                      {c.first_name} {c.last_name}
                    </div>
                    {c.national_id && (
                      <div className="text-xs text-slate-500">ID: {c.national_id}</div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Phone size={12} /> {c.phone}
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Mail size={12} /> {c.email}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-slate-700 font-mono text-xs">{c.license_number ?? '—'}</div>
                    {c.license_expiry && (
                      <div className="text-xs text-slate-500 mt-0.5">exp {c.license_expiry}</div>
                    )}
                  </td>
                  <td>{(c.branches as any)?.name ?? '—'}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs ${c.is_active ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}