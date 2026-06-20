'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  ExternalLink,
  UtensilsCrossed,
  Loader2,
  Phone,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  delivery_cities: string[];
  cuisines: string[];
  primary_color: string;
  logo_url: string | null;
}

function getRestaurantUrl(slug: string): string {
  if (typeof window === 'undefined') return `/restaurant/${slug}`;
  const { hostname, protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : '';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `/restaurant/${slug}`;
  }
  const parts = hostname.split('.');
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  return `${protocol}//${slug}.${baseDomain}${portSuffix}`;
}

export default function SearchPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id, name, slug, address, phone, delivery_cities, cuisines, primary_color, logo_url')
        .eq('is_active', true)
        .order('name');
      setRestaurants((data as Restaurant[]) || []);
      setFiltered((data as Restaurant[]) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    const c = cityQuery.toLowerCase().trim();
    setFiltered(
      restaurants.filter((r) => {
        const matchName = !q || r.name.toLowerCase().includes(q) || r.cuisines?.some((cu) => cu.toLowerCase().includes(q));
        const matchCity =
          !c ||
          r.address?.toLowerCase().includes(c) ||
          r.delivery_cities?.some((city) => city.toLowerCase().includes(c));
        return matchName && matchCity;
      })
    );
  }, [query, cityQuery, restaurants]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 select-none">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg overflow-hidden bg-slate-900">
              <img
                src="/image.png"
                alt="SYORDER"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-widest text-sm uppercase">SYORDER</span>
              <span className="block text-xs text-slate-400 leading-tight">Étterem kereső</span>
            </div>
          </Link>
          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            Partner belépés <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Search hero */}
      <div className="bg-slate-900 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Találd meg a legjobb éttermet!
          </h1>
          <p className="text-slate-400 mb-8">
            Keress név, konyhatípus vagy szállítási terület alapján
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Étterem neve vagy konyhatípus..."
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 h-12 rounded-xl text-base"
              />
            </div>
            <div className="relative sm:w-56">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Szállítási város..."
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 h-12 rounded-xl text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-14 w-14 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Nincs találat</h2>
            <p className="text-slate-400 text-sm">
              {restaurants.length === 0
                ? 'Még nincs regisztrált étterem a platformon.'
                : 'Próbálj más keresési feltételt!'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <strong className="text-slate-800">{filtered.length}</strong> étterem
                {(query || cityQuery) && ' a feltételeknek megfelelően'}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-400 bg-white">
        © {new Date().getFullYear()} SYORDER — Magyar Vendéglátós Platform
      </footer>
    </div>
  );
}

function RestaurantCard({ restaurant: r }: { restaurant: Restaurant }) {
  const href = getRestaurantUrl(r.slug);
  const primary = r.primary_color || '#1e293b';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group">
      {/* Color band */}
      <div
        className="h-2"
        style={{ background: `linear-gradient(90deg, ${primary}, ${primary}99)` }}
      />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          {r.logo_url ? (
            <img
              src={r.logo_url}
              alt={r.name}
              className="h-12 w-12 rounded-xl object-contain border border-slate-100 bg-slate-50 shrink-0"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0"
              style={{ backgroundColor: primary }}
            >
              {r.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{r.name}</h3>
            {r.cuisines?.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">{r.cuisines.join(' · ')}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 mb-4 text-xs text-slate-500">
          {r.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>{r.address}</span>
            </div>
          )}
          {r.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{r.phone}</span>
            </div>
          )}
          {r.delivery_cities?.length > 0 && (
            <div className="flex items-start gap-1.5">
              <span className="text-slate-400 shrink-0">Szállítás:</span>
              <span>{r.delivery_cities.join(', ')}</span>
            </div>
          )}
        </div>

        <Link href={href} target={href.startsWith('http') ? '_blank' : undefined}>
          <button
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 group-hover:shadow-md"
            style={{ backgroundColor: primary }}
          >
            Menü megtekintése
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}
