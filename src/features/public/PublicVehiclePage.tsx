import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Users, Fuel, Cog, Calendar, CheckCircle2, MapPin,
  Shield, Star, ChevronLeft, ChevronRight, Car,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PublicVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const [pickupAt, setPickupAt] = useState(toLocalInput(tomorrow));
  const [returnAt, setReturnAt] = useState(toLocalInput(dayAfter));
  const [activeMedia, setActiveMedia] = useState(0);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['public_vehicle', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id, make, model, year, trim, colour, category, daily_rate, transmission,
          seats, fuel, mileage, registration, notes, features, status, branch_id,
          vehicle_media(id, storage_path, is_featured, display_order),
          branches(id, name, code, address)
        `)
        .eq('id', id!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: otherVehicles = [] } = useQuery({
    queryKey: ['public_other_vehicles', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, year, daily_rate, vehicle_media(storage_path, is_featured, display_order)')
        .eq('is_active', true)
        .in('status', ['available', 'booked', 'reserved'])
        .neq('id', id!)
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const days = useMemo(() => {
    const p = new Date(pickupAt).getTime();
    const r = new Date(returnAt).getTime();
    if (!p || !r || r <= p) return 0;
    return Math.max(1, Math.ceil((r - p) / (1000 * 60 * 60 * 24)));
  }, [pickupAt, returnAt]);

  const total = days * Number(vehicle?.daily_rate ?? 0);

  const media = useMemo(() => {
    if (!vehicle) return [];
    return [...((vehicle as any).vehicle_media ?? [])].sort((a: any, b: any) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.display_order - b.display_order;
    });
  }, [vehicle]);

  const imageUrl = (path: string) =>
    supabase.storage.from('vehicle-media').getPublicUrl(path).data.publicUrl;

  const onBook = () => {
    const params = new URLSearchParams({
      vehicle: id ?? '',
      pickup: new Date(pickupAt).toISOString(),
      return: new Date(returnAt).toISOString(),
    });
    navigate(`/login?next=${encodeURIComponent('/my/new-booking?' + params.toString())}`);
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-6 py-20 text-slate-500">Loading…</div>;
  if (error || !vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy">Vehicle not found</h1>
        <Link to="/fleet" className="mt-4 inline-block text-primary hover:text-primary-dark">
          Back to fleet →
        </Link>
      </div>
    );
  }

  const v = vehicle as any;
  const specs = [
    { icon: Calendar, label: 'Year', value: v.year ?? '—' },
    { icon: Cog, label: 'Transmission', value: v.transmission ?? '—' },
    { icon: Users, label: 'Seats', value: v.seats ?? '—' },
    { icon: Fuel, label: 'Fuel', value: v.fuel ?? '—' },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link to="/fleet" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
          <ArrowLeft size={16} /> Back to fleet
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
            {media.length > 0 ? (
              <>
                <img
                  src={imageUrl(media[activeMedia].storage_path)}
                  alt={`${v.make} ${v.model}`}
                  className="w-full h-full object-cover"
                />
                {media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveMedia((i) => (i - 1 + media.length) % media.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMedia((i) => (i + 1) % media.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Car size={80} />
              </div>
            )}
            {v.category && (
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur text-navy text-xs font-medium px-3 py-1 rounded-full capitalize">
                {v.category}
              </div>
            )}
          </div>

          {media.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {media.slice(0, 5).map((m: any, i: number) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMedia(i)}
                  className={`aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 transition ${
                    i === activeMedia ? 'border-primary' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={imageUrl(m.storage_path)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-navy text-lg mb-4">Specification</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specs.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-500 mb-1">
                    <s.icon size={12} /> {s.label}
                  </div>
                  <div className="text-navy font-medium capitalize">{String(s.value)}</div>
                </div>
              ))}
            </div>
            {(v.colour || v.trim || v.mileage) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-sm">
                {v.colour && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Colour</div>
                    <div className="text-navy capitalize">{v.colour}</div>
                  </div>
                )}
                {v.trim && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Trim</div>
                    <div className="text-navy">{v.trim}</div>
                  </div>
                )}
                {v.mileage != null && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Mileage</div>
                    <div className="text-navy">{Number(v.mileage).toLocaleString()} km</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-navy text-lg mb-4">Included with every hire</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Comprehensive insurance',
                'Unlimited mileage within Kenya',
                'Roadside assistance 24/7',
                'Clean, serviced, ready to drive',
                'Deposit refunded within 3 days',
                'Digital rental agreement',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 lg:sticky lg:top-24">
            <div>
              <h1 className="text-2xl font-bold text-navy">
                {v.make} {v.model}
              </h1>
              <div className="text-sm text-slate-500 mt-1">
                {[v.year, v.transmission, v.seats ? `${v.seats} seats` : null].filter(Boolean).join(' · ')}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">{v.registration}</div>
            </div>

            {v.branches && (
              <div className="mt-4 flex items-start gap-2 text-sm text-slate-600 pb-4 border-b border-slate-100">
                <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-navy font-medium">{v.branches.name}</div>
                  <div className="text-xs text-slate-500">{v.branches.address}</div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="text-3xl font-bold text-navy">
                ${Number(v.daily_rate).toLocaleString()}
                <span className="text-sm font-normal text-slate-500"> / day</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pickup</label>
                <input
                  type="datetime-local"
                  value={pickupAt}
                  onChange={(e) => setPickupAt(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Return</label>
                <input
                  type="datetime-local"
                  value={returnAt}
                  onChange={(e) => setReturnAt(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {days > 0 && (
              <div className="mt-4 bg-slate-50 rounded-md p-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{days} day{days > 1 ? 's' : ''} × ${Number(v.daily_rate).toLocaleString()}</span>
                  <span className="font-mono">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-navy pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono">${total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onBook}
              disabled={days <= 0}
              className="mt-5 w-full bg-primary hover:bg-primary-dark text-white rounded-lg py-3 font-semibold disabled:opacity-60 transition"
            >
              Book this vehicle
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              You'll be asked to sign in or create a free account.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-success" /> Fully insured
              </div>
              <div className="flex items-center gap-2">
                <Star size={12} className="text-warning" /> 4.8 average rating
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-primary" /> Free cancellation up to 24h
              </div>
            </div>
          </div>
        </div>
      </section>

      {otherVehicles.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-100">
          <h2 className="text-2xl font-bold text-navy mb-6">Similar vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherVehicles.map((o: any) => {
              const oMedia = [...(o.vehicle_media ?? [])].sort((a: any, b: any) => {
                if (a.is_featured && !b.is_featured) return -1;
                if (!a.is_featured && b.is_featured) return 1;
                return a.display_order - b.display_order;
              })[0];
              const oImg = oMedia ? imageUrl(oMedia.storage_path) : null;
              return (
                <Link
                  key={o.id}
                  to={`/fleet/${o.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {oImg ? (
                      <img src={oImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Car size={48} /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-navy">{o.make} {o.model}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{o.year}</div>
                    <div className="mt-3 text-xl font-bold text-navy">
                      ${Number(o.daily_rate).toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> / day</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
