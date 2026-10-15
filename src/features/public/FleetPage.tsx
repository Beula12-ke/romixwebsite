import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Car, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function FleetPage() {
  const [params, setParams] = useSearchParams();

  const [branch, setBranch] = useState(params.get('branch') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [transmission, setTransmission] = useState('');
  const [fuel, setFuel] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['public_branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['public_fleet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id, make, model, year, category, daily_rate, transmission, seats, fuel,
          branch_id, registration, status,
          vehicle_media(storage_path, is_featured, display_order)
        `)
        .eq('is_active', true)
        .in('status', ['available', 'booked', 'reserved']);
      if (error) throw error;
      return data ?? [];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v: any) => { if (v.category) set.add(v.category); });
    return Array.from(set).sort();
  }, [vehicles]);

  const filtered = useMemo(() => {
    let list = [...vehicles];

    if (branch) list = list.filter((v: any) => v.branch_id === branch);
    if (category) list = list.filter((v: any) => v.category === category);
    if (transmission) list = list.filter((v: any) => v.transmission === transmission);
    if (fuel) list = list.filter((v: any) => v.fuel === fuel);
    if (minSeats) list = list.filter((v: any) => (v.seats ?? 0) >= Number(minSeats));
    if (maxPrice) list = list.filter((v: any) => Number(v.daily_rate) <= Number(maxPrice));

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((v: any) =>
        `${v.make} ${v.model} ${v.registration ?? ''}`.toLowerCase().includes(needle),
      );
    }

    if (sort === 'price_asc') list.sort((a: any, b: any) => Number(a.daily_rate) - Number(b.daily_rate));
    else if (sort === 'price_desc') list.sort((a: any, b: any) => Number(b.daily_rate) - Number(a.daily_rate));
    else list.sort((a: any, b: any) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

    return list;
  }, [vehicles, branch, category, transmission, fuel, minSeats, maxPrice, q, sort]);

  const clearAll = () => {
    setBranch('');
    setCategory('');
    setTransmission('');
    setFuel('');
    setMinSeats('');
    setMaxPrice('');
    setQ('');
    setSort('newest');
    setParams({});
  };

  const activeFilterCount =
    [branch, category, transmission, fuel, minSeats, maxPrice].filter(Boolean).length;

  const updateUrlBranch = (value: string) => {
    setBranch(value);
    const next = new URLSearchParams(params);
    if (value) next.set('branch', value);
    else next.delete('branch');
    setParams(next, { replace: true });
  };

  return (
    <div>
      <section className="bg-navy text-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold">Our Fleet</h1>
          <p className="text-white/70 mt-2">
            {isLoading ? 'Loading vehicles…' : `${filtered.length} vehicle${filtered.length === 1 ? '' : 's'} available`}
          </p>

          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search make, model, or registration…"
                className="w-full bg-white text-navy rounded-lg pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-white text-navy rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center justify-center gap-2 bg-white text-navy rounded-lg px-4 py-3 font-medium hover:bg-slate-100"
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {showFilters && (
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => updateUrlBranch(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 bg-white text-sm"
                >
                  <option value="">All branches</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 bg-white text-sm">
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Transmission</label>
                <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 bg-white text-sm">
                  <option value="">Any</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Fuel</label>
                <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 bg-white text-sm">
                  <option value="">Any</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Min seats</label>
                <input type="number" min="1" value={minSeats} onChange={(e) => setMinSeats(e.target.value)} placeholder="Any" className="w-full border border-slate-300 rounded-md p-2 bg-white text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Max price / day</label>
                <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" className="w-full border border-slate-300 rounded-md p-2 bg-white text-sm" />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={clearAll} className="text-sm text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1">
                  <X size={14} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center text-slate-500 py-20">Loading fleet…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-16 text-center">
            <Car size={56} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-navy">No vehicles match your filters</h2>
            <p className="text-slate-500 mt-2">Try widening your search or clearing filters.</p>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAll} className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2 text-sm font-medium">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v: any) => {
              const media = (v.vehicle_media ?? []).sort((a: any, b: any) => {
                if (a.is_featured && !b.is_featured) return -1;
                if (!a.is_featured && b.is_featured) return 1;
                return a.display_order - b.display_order;
              })[0];
              const imageUrl = media
                ? supabase.storage.from('vehicle-media').getPublicUrl(media.storage_path).data.publicUrl
                : null;
              const branchName = branches.find((b: any) => b.id === v.branch_id)?.name;

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
                    {v.status !== 'available' && (
                      <div className="absolute top-3 right-3 bg-warning/95 text-white text-xs font-medium px-3 py-1 rounded-full capitalize">
                        {String(v.status).replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-navy text-lg">{v.make} {v.model}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {[v.year, v.transmission, v.seats ? `${v.seats} seats` : null, v.fuel].filter(Boolean).join(' · ')}
                    </div>
                    {branchName && (
                      <div className="text-xs text-slate-400 mt-2">{branchName}</div>
                    )}
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
      </section>
    </div>
  );
}
