import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Shield, MapPin, Headphones, CreditCard, ArrowRight,
  Users, Car, CheckCircle2, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HomePage() {
  const navigate = useNavigate();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const [pickupBranch, setPickupBranch] = useState('');
  const [pickupAt, setPickupAt] = useState(toLocalInput(tomorrow));
  const [returnAt, setReturnAt] = useState(toLocalInput(dayAfter));

  const { data: branches = [] } = useQuery({
    queryKey: ['public_branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code, address')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: featuredVehicles = [] } = useQuery({
    queryKey: ['public_featured_vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, year, category, daily_rate, transmission, seats, vehicle_media(storage_path, is_featured, display_order)')
        .eq('is_active', true)
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['public_stats'],
    queryFn: async () => {
      const [vehRes, brRes] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('branches').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return { vehicles: vehRes.count ?? 0, branches: brRes.count ?? 0 };
    },
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupBranch) params.set('branch', pickupBranch);
    if (pickupAt) params.set('pickup', new Date(pickupAt).toISOString());
    if (returnAt) params.set('return', new Date(returnAt).toISOString());
    navigate(`/fleet?${params.toString()}`);
  };

  return (
    <div>
      <section className="relative bg-navy text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Now serving {stats?.branches ?? 0} branches across Kenya
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Reliable Cars.<br />
              Multiple Branches.<br />
              <span className="text-primary">One Platform.</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Rent. Track. Manage. Grow. Choose from {stats?.vehicles ?? 0}+ vehicles with real-time availability, transparent pricing, and instant confirmation.
            </p>
          </div>

          <form onSubmit={onSearch} className="mt-10 bg-white rounded-xl shadow-2xl p-2 md:p-3 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="p-3">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pickup branch</label>
                <select value={pickupBranch} onChange={(e) => setPickupBranch(e.target.value)} className="w-full bg-transparent text-navy font-medium focus:outline-none cursor-pointer">
                  <option value="">Any branch</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="p-3 md:border-l border-slate-200">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pickup date</label>
                <input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} className="w-full bg-transparent text-navy font-medium focus:outline-none" />
              </div>
              <div className="p-3 md:border-l border-slate-200">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Return date</label>
                <input type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} className="w-full bg-transparent text-navy font-medium focus:outline-none" />
              </div>
              <button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center gap-2 py-3 font-medium">
                <Search size={18} /> Search Vehicles
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Feature icon={Car} label="Wide Range" sub="Sedans to SUVs" />
          <Feature icon={MapPin} label="Multi-Branch" sub="Nairobi & Mombasa" />
          <Feature icon={Shield} label="Fully Insured" sub="All vehicles covered" />
          <Feature icon={CreditCard} label="Easy Payment" sub="Cash, card, M-Pesa" />
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">Our Fleet</div>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-navy">Featured Vehicles</h2>
              <p className="text-slate-500 mt-2">Handpicked, well-maintained, ready to hire</p>
            </div>
            <Link to="/fleet" className="hidden md:inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {featuredVehicles.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-slate-500">
              No vehicles listed yet. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredVehicles.slice(0, 6).map((v: any) => {
                const media = (v.vehicle_media ?? []).sort((a: any, b: any) => {
                  if (a.is_featured && !b.is_featured) return -1;
                  if (!a.is_featured && b.is_featured) return 1;
                  return a.display_order - b.display_order;
                })[0];
                const imageUrl = media ? supabase.storage.from('vehicle-media').getPublicUrl(media.storage_path).data.publicUrl : null;
                return (
                  <Link key={v.id} to={`/fleet/${v.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100">
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Car size={64} /></div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-navy text-xs font-medium px-3 py-1 rounded-full capitalize">
                        {v.category ?? 'Vehicle'}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-navy text-lg">{v.make} {v.model}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {[v.year, v.transmission, v.seats ? `${v.seats} seats` : null].filter(Boolean).join(' · ')}
                      </div>
                      <div className="mt-4 flex items-end justify-between pt-4 border-t border-slate-100">
                        <div className="text-2xl font-bold text-navy">
                          ${Number(v.daily_rate).toLocaleString()}
                          <span className="text-xs font-normal text-slate-500"> / day</span>
                        </div>
                        <span className="text-primary group-hover:text-primary-dark text-sm font-medium">View →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">Why Choose Us</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-navy">Built for real journeys</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Benefit icon={Shield} title="Trusted & Insured" text="Every vehicle is fully insured, regularly serviced, and inspected before every hire." />
            <Benefit icon={Headphones} title="24/7 Support" text="Real human support on call, day and night. Emergency roadside assistance included." />
            <Benefit icon={MapPin} title="Flexible Branches" text="Pick up in Nairobi, return in Mombasa. Multi-branch coverage without the hassle." />
            <Benefit icon={CreditCard} title="Transparent Pricing" text="No hidden fees. Daily rates clearly displayed. Deposit held and released automatically." />
            <Benefit icon={Users} title="Family Friendly" text="From 2-seaters to 7-seater vans. Child seats and extra drivers available on request." />
            <Benefit icon={CheckCircle2} title="Instant Booking" text="Real-time availability. Confirmed within minutes. Digital rental agreement." />
          </div>
        </div>
      </section>

      <section className="bg-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">Partner Program</div>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">Turn Your Vehicle Into Income</h2>
              <p className="mt-4 text-white/70 text-lg">
                Own a car and want it earning? Place it into our fleet. We handle bookings, customers, insurance verification, and payouts.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/partner" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-6 py-3 font-medium">
                  Apply Now <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white rounded-md px-6 py-3 font-medium">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatBlock value={`${stats?.vehicles ?? 0}+`} label="Vehicles in fleet" />
              <StatBlock value={`${stats?.branches ?? 0}`} label="Active branches" />
              <StatBlock value="24/7" label="Support coverage" />
              <StatBlock value="100%" label="Insured journeys" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">Testimonials</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-navy">Loved by customers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial name="Sarah W." role="Business traveller" text="Clean cars, transparent pricing, and the booking took 30 seconds. This is how car hire should work." />
            <Testimonial name="David M." role="Family holiday" text="Picked up in Nairobi, dropped off in Mombasa. No paperwork drama. Definitely using them again." />
            <Testimonial name="Aisha K." role="Partner vehicle owner" text="My car earns every weekend. Payouts are always on time and the dashboard shows everything." />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">Where we operate</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-navy">Our Branches</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.length === 0 ? (
              <div className="col-span-full text-center text-slate-500 py-8">Branches coming soon.</div>
            ) : (
              branches.map((b: any) => (
                <Link key={b.id} to={`/fleet?branch=${b.id}`} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition group border border-slate-100">
                  <MapPin size={24} className="text-primary" />
                  <h3 className="mt-3 font-semibold text-navy group-hover:text-primary transition">{b.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{b.address ?? '—'}</p>
                  <div className="text-xs text-primary mt-3 font-medium">View vehicles →</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-10 md:p-14 text-white text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to hit the road?</h2>
            <p className="mt-4 text-white/90 text-lg max-w-xl mx-auto">
              Book in under a minute. Real-time availability, instant confirmation, no paperwork drama.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/fleet" className="inline-flex items-center gap-2 bg-white text-primary hover:bg-slate-100 rounded-md px-6 py-3 font-semibold">
                Browse Vehicles <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 border-2 border-white/60 hover:bg-white/10 text-white rounded-md px-6 py-3 font-semibold">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center text-primary mb-3">
        <Icon size={22} />
      </div>
      <div className="font-semibold text-navy">{label}</div>
      <div className="text-sm text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Benefit({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
      <div className="inline-flex w-11 h-11 rounded-lg bg-primary/10 items-center justify-center text-primary">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 font-semibold text-navy text-lg">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{text}</p>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
      <div className="text-3xl md:text-4xl font-bold">{value}</div>
      <div className="text-sm text-white/70 mt-1">{label}</div>
    </div>
  );
}

function Testimonial({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
      <div className="flex gap-1 text-primary mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill="currentColor" />
        ))}
      </div>
      <p className="text-slate-700 leading-relaxed">"{text}"</p>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="font-medium text-navy text-sm">{name}</div>
        <div className="text-xs text-slate-500">{role}</div>
      </div>
    </div>
  );
}
