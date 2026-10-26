import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Clock, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function PublicBranchesPage() {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['public_branches_full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <section className="bg-navy text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold">Our Branches</h1>
          <p className="text-white/70 mt-3 text-lg max-w-2xl">
            Multiple locations across Kenya. Pick up in one city, drop off in another.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="text-slate-500">Loading branches…</div>
        ) : branches.length === 0 ? (
          <div className="text-center text-slate-500 py-16">Branches coming soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((b: any) => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-navy">{b.name}</h2>
                    <div className="text-xs font-mono text-slate-500 mt-1">{b.code}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin size={20} className="text-primary" />
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  {b.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                      <span>{b.address}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <a href={`tel:${b.phone}`} className="hover:text-primary">{b.phone}</a>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <a href={`mailto:${b.email}`} className="hover:text-primary">{b.email}</a>
                    </div>
                  )}
                  {b.opening_hours && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>Mon–Sun · 7:00 AM – 9:00 PM</span>
                    </div>
                  )}
                </div>

                {b.pickup_instructions && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    {b.pickup_instructions}
                  </div>
                )}

                <Link
                  to={`/fleet?branch=${b.id}`}
                  className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
                >
                  <Car size={14} /> View vehicles at this branch
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
