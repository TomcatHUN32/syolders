'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  ChefHat,
  TrendingUp,
  Shield,
  Loader2,
  Search,
  MapPin,
  Star,
  ExternalLink,
  AlertCircle,
  LogIn,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlatformStats {
  activeRestaurants: number;
  totalOrders: number;
  avgRating: number;
  satisfiedOwners: number;
}

interface RestaurantResult {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  delivery_cities: string[];
  cuisines: string[];
  primary_color: string;
}

type PlanKey = 'indulo' | 'professzionalis';
type BillingKey = 'havi' | 'negyedeves' | 'eves';

const PRICING: Record<PlanKey, Record<BillingKey, { monthly: number; total: number; saving: number }>> = {
  indulo: {
    havi:       { monthly: 14900, total: 14900,  saving: 0 },
    negyedeves: { monthly: 13500, total: 40500,  saving: 3200 },
    eves:       { monthly: 11900, total: 142800, saving: 25800 },
  },
  professzionalis: {
    havi:       { monthly: 29900, total: 29900,  saving: 0 },
    negyedeves: { monthly: 27500, total: 82500,  saving: 7200 },
    eves:       { monthly: 23900, total: 286800, saving: 72000 },
  },
};

const PLAN_LABELS: Record<PlanKey, string> = { indulo: 'Induló', professzionalis: 'Professzionális' };
const BILLING_LABELS: Record<BillingKey, string> = { havi: 'Havi', negyedeves: 'Negyedéves', eves: 'Éves' };

const FEATURES = [
  { icon: ShoppingBag, title: 'Valós idejű Rendeléskezelés', desc: 'Minden rendelés azonnal megjelenik és kezelhető az irányítópulton.' },
  { icon: Package,    title: 'Okos Készletkövetés',          desc: 'Automatikus riasztás 30% alatti készletnél, recept alapú fogyasztáskövetés.' },
  { icon: Users,      title: 'Hűségprogram',                  desc: 'Pontgyűjtős hűségrendszer, VIP vendégek kezelése.' },
  { icon: BarChart3,  title: 'Részletes Analitika',           desc: 'Bevételi trendek, legjobban teljesítő tételek, időszaki összehasonlítás.' },
  { icon: Globe,      title: 'Nyilvános Menüoldal',           desc: 'Saját aldomainen megjeleníthető, márkázható online menü.' },
  { icon: Shield,     title: 'Teljes Adatbiztonság',          desc: 'Restaurant-szintű adatelszigeteltség, biztonságos multi-tenant architektúra.' },
];

const PLANS: { key: PlanKey; name: string; desc: string; features: string[]; highlighted: boolean }[] = [
  {
    key: 'indulo',
    name: 'Induló',
    desc: 'Kis éttermek és büfék számára',
    features: ['1 helyszín', 'Korlátlan rendelés', 'Menükezelés', 'Alap analitika', 'Kassza integráció', 'E-mail support'],
    highlighted: false,
  },
  {
    key: 'professzionalis',
    name: 'Professzionális',
    desc: 'Növekvő vendéglátóhelyek számára',
    features: ['Több helyszín', 'Korlátlan rendelés', 'Készletkezelés', 'Hűségprogram', 'Részletes analitika', 'Kassza & szállítási integráció', 'API hozzáférés', 'Prioritásos support'],
    highlighted: true,
  },
];

function fmt(n: number) { return n.toLocaleString('hu-HU'); }

function StarRow({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} className={cn('h-4 w-4', i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700')} />
        ))}
      </div>
      <span className="text-sm font-semibold text-white">{value > 0 ? value.toFixed(1) : '—'}</span>
      <span className="text-sm text-slate-500">({count} értékelés)</span>
    </div>
  );
}

function AnimatedNumber({ target, loading }: { target: number; loading: boolean }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (loading || target === 0) { setDisplay(target); return; }
    const start = 0;
    const duration = 1200;
    const startTime = performance.now();
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, loading]);

  return <>{loading ? <span className="opacity-30">—</span> : fmt(display)}</>;
}

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [stats, setStats] = useState<PlatformStats>({ activeRestaurants: 0, totalOrders: 0, avgRating: 0, satisfiedOwners: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeBilling, setActiveBilling] = useState<BillingKey>('havi');
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState<RestaurantResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('indulo');
  const [selectedBilling, setSelectedBilling] = useState<BillingKey>('havi');
  const [form, setForm] = useState({ business_name: '', contact_name: '', email: '', phone: '', city: '', address: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const [tenantsRes, ordersRes, reviewsRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('platform_reviews').select('rating'),
      ]);
      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      setStats({
        activeRestaurants: tenantsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        avgRating,
        satisfiedOwners: reviews.filter((r) => r.rating >= 4).length,
      });
      setStatsLoading(false);
    })();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchName.trim() && !searchCity.trim()) { toast.error('Adj meg legalább egy keresési feltételt!'); return; }
    setSearching(true);
    setSearchResults(null);
    let query = supabase.from('tenants').select('id, name, slug, address, delivery_cities, cuisines, primary_color').eq('is_active', true);
    if (searchName.trim()) query = query.ilike('name', `%${searchName.trim()}%`);
    if (searchCity.trim()) query = query.or(`address.ilike.%${searchCity.trim()}%,delivery_cities.cs.{"${searchCity.trim()}"}`);
    const { data } = await query.limit(20);
    setSearchResults(data || []);
    setSearching(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name || !form.contact_name || !form.email) { toast.error('Kérjük, töltsd ki a kötelező mezőket!'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('restaurant_requests').insert({
        business_name: form.business_name, contact_name: form.contact_name, email: form.email,
        phone: form.phone || null, city: form.city || null, address: form.address || null,
        message: form.message || null, plan: selectedPlan, billing_period: selectedBilling,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Igénylésed sikeresen beérkezett!');
    } catch (err) {
      console.error(err);
      toast.error('Hiba történt, kérjük próbáld újra.');
    } finally {
      setSubmitting(false);
    }
  }

  const chosenPricing = PRICING[selectedPlan][selectedBilling];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl px-5 h-14 flex items-center justify-between shadow-lg shadow-black/30">
            <Link href="/" className="flex items-center gap-3 select-none">
              {/* Logo — screen blend makes the gray checkerboard invisible on dark bg */}
              <div className="w-8 h-8 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="/image.png"
                  alt="SYORDER"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="text-base font-bold tracking-widest text-white uppercase">SYORDER</span>
            </Link>

            <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
              {[['#search','Étterem keresés'],['#features','Funkciók'],['#pricing','Árak'],['#igenyles','Igénylés']].map(([h,l])=>(
                <a key={h} href={h} className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1.5 hover:bg-slate-800">
                  <LogIn className="h-3.5 w-3.5" /> Belépés
                </Button>
              </Link>
              <a href="#igenyles" className="hidden md:inline-flex">
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                  Igénylés
                </Button>
              </a>
              <button className="md:hidden p-1.5" onClick={() => setNavOpen(!navOpen)}>
                {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {navOpen && (
            <div className="md:hidden mt-2 max-w-6xl mx-auto bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-4 space-y-1">
              {[['#search','Étterem keresés'],['#features','Funkciók'],['#pricing','Árak'],['#igenyles','Igénylés']].map(([h,l])=>(
                <a key={h} href={h} onClick={() => setNavOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-sm transition-colors">{l}</a>
              ))}
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-300 bg-transparent">Belépés</Button></Link>
                <a href="#igenyles" className="flex-1"><Button size="sm" className="w-full bg-white text-slate-900">Igénylés</Button></a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-4">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(100,116,139,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(100,116,139,.07) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-slate-700/10 rounded-full blur-[120px] pointer-events-none" />
        {/* Accent lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-transparent via-slate-600/40 to-transparent" />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/5 rounded-3xl blur-2xl scale-125" />
              <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-2xl overflow-hidden">
                <img
                  src="/image.png"
                  alt="SYORDER Logo"
                  width={80}
                  height={80}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/50 text-xs text-slate-400 mb-8 tracking-wider uppercase">
            <Zap className="h-3 w-3 text-amber-400" />
            Magyar Vendéglátós SaaS Platform
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.04] mb-6">
            <span className="text-white">Az éttermed</span>
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 40%, #64748b 100%)' }}
            >
              teljesen digitálisan
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Valós idejű rendeléskezelés, okos készletkövetés, hűségprogram és részletes analitika —
            telepítés és IT csapat nélkül.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#igenyles">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-12 px-8 font-bold text-base shadow-xl shadow-white/10">
                Ingyenes Igénylés <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" size="lg" className="border-slate-700 text-slate-300 h-12 px-8 text-base hover:bg-slate-900/50 bg-transparent">
                Funkciók megtekintése
              </Button>
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur divide-x divide-y md:divide-y-0 divide-slate-800/60">
            <div className="px-6 py-6 text-center">
              <div className="text-3xl font-black text-white tabular-nums">
                <AnimatedNumber target={stats.activeRestaurants} loading={statsLoading} />
              </div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Aktív étterem</div>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="text-3xl font-black text-white tabular-nums">
                <AnimatedNumber target={stats.totalOrders} loading={statsLoading} />
              </div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Kezelt rendelés</div>
            </div>
            <div className="px-6 py-6 text-center flex flex-col items-center justify-center gap-1">
              <div className="text-3xl font-black text-white tabular-nums">
                <AnimatedNumber target={stats.satisfiedOwners} loading={statsLoading} />
              </div>
              <StarRow value={stats.avgRating} count={stats.satisfiedOwners} />
              <div className="text-xs text-slate-500 uppercase tracking-wider">Elégedett tulajdonos</div>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="text-3xl font-black text-white">99.9%</div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Rendelkezésre állás</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Restaurant Finder ── */}
      <section id="search" className="py-20 px-4 border-y border-slate-800/60 bg-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-xs text-slate-400 mb-4 uppercase tracking-wider">
              <Search className="h-3 w-3" /> Étterem kereső
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Keres éttermet, ami szállít hozzád?</h2>
            <p className="text-slate-400 text-sm">Keresés étteremnév és/vagy szállítási város alapján</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Étterem neve..." className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 h-11 rounded-xl" />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Szállítási város..." className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 h-11 rounded-xl" />
            </div>
            <Button type="submit" disabled={searching} className="h-11 px-6 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shrink-0">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Keresés'}
            </Button>
          </form>

          {searchResults !== null && (
            <div className="mt-5 space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-10 border border-slate-800 rounded-xl">
                  <Search className="h-9 w-9 mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">Nincs találat. Próbálj más feltételt!</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 px-1">{searchResults.length} találat</p>
                  {searchResults.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/50 hover:border-slate-700 transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{ backgroundColor: r.primary_color || '#334155' }}>
                        {r.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{r.name}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-slate-500">
                          {r.address && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{r.address}</span>}
                          {r.delivery_cities?.length > 0 && <span>Szállítás: {r.delivery_cities.join(', ')}</span>}
                        </div>
                        {r.cuisines?.length > 0 && (
                          <div className="flex gap-1 mt-1.5">{r.cuisines.map((c) => <Badge key={c} variant="secondary" className="text-xs bg-slate-800 text-slate-400 border-slate-700 py-0">{c}</Badge>)}</div>
                        )}
                      </div>
                      <Link href={`/menu/${r.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent gap-1.5 rounded-lg shrink-0">
                          Menü <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Minden, amire szükséged van</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Professzionális vendéglátós szoftver, amely az éttermed teljes működését lefedi.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/60 hover:bg-slate-900/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 group-hover:border-slate-600 transition-colors">
                  <f.icon className="h-4.5 w-4.5 text-slate-300 h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 border-y border-slate-800/60 bg-slate-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Hogyan működik?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Küldd be az igénylést', desc: 'Töltsd ki az alábbi űrlapot az éttermed alapadataival.', icon: ChefHat },
              { step: '02', title: 'Aktiválás 24 órán belül', desc: 'Csapatunk feldolgozza a kérést és aktiválja a fiókodat.', icon: Zap },
              { step: '03', title: 'Kezdd el használni', desc: 'Bejelentkezel és azonnal elkezdheted a rendelések kezelését.', icon: TrendingUp },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Áraink</h2>
            <p className="text-slate-400 mb-8">Rejtett díjak nélkül, azonnali aktiválással.</p>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              {(Object.entries(BILLING_LABELS) as [BillingKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setActiveBilling(key)}
                  className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', activeBilling === key ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white')}>
                  {label}
                  {key === 'eves' && <span className="ml-1.5 text-xs text-emerald-400 font-bold">−20%</span>}
                  {key === 'negyedeves' && <span className="ml-1.5 text-xs text-amber-400 font-bold">−10%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {PLANS.map((plan) => {
              const p = PRICING[plan.key][activeBilling];
              return (
                <div key={plan.key} className={cn('relative rounded-2xl border p-6', plan.highlighted ? 'border-slate-400/50 bg-slate-900/80 shadow-2xl shadow-white/5' : 'border-slate-800 bg-slate-900/30')}>
                  {plan.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-white text-slate-900 px-4 py-0.5 text-xs font-bold">Legnépszerűbb</Badge></div>}
                  <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                  <div className="mb-2">
                    <span className="text-4xl font-black text-white">{fmt(p.monthly)}</span>
                    <span className="text-slate-500 text-sm ml-1">Ft / hó</span>
                  </div>
                  {activeBilling !== 'havi' && (
                    <div className="mb-4 text-xs space-y-0.5">
                      <p className="text-slate-400">Összesen: <span className="text-white font-semibold">{fmt(p.total)} Ft</span></p>
                      <p className="text-emerald-400 font-semibold">Megtakarítás: {fmt(p.saving)} Ft/év</p>
                    </div>
                  )}
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <a href="#igenyles" onClick={() => { setSelectedPlan(plan.key); setSelectedBilling(activeBilling); }}>
                    <Button className={cn('w-full', plan.highlighted ? 'bg-white text-slate-900 hover:bg-slate-100 font-bold' : 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent')} variant={plan.highlighted ? 'default' : 'outline'}>
                      Igénylés — {PLAN_LABELS[plan.key]}, {BILLING_LABELS[activeBilling]}
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section id="igenyles" className="py-24 px-4 border-t border-slate-800/60 bg-slate-900/20">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-xs text-slate-400 mb-4 uppercase tracking-wider">
              Ingyenes Igénylés
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Csatlakozz a SYORDER-hez</h2>
            <p className="text-slate-400">Küldd be az adataidat és 24 órán belül aktiváljuk az éttermedet.</p>
          </div>

          {submitted ? (
            <div className="border border-emerald-800/60 bg-emerald-950/30 rounded-2xl py-16 px-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Igénylés beérkezett!</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Köszönjük! Csapatunk hamarosan felveszi veled a kapcsolatot a <strong className="text-white">{form.email}</strong> email-címen.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800/60 rounded-2xl bg-slate-900/40 p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Plan selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Csomag <span className="text-red-400">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLANS.map((plan) => (
                      <button key={plan.key} type="button" onClick={() => setSelectedPlan(plan.key)}
                        className={cn('p-3.5 rounded-xl border text-left transition-all', selectedPlan === plan.key ? 'border-white bg-white/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600')}>
                        <div className="text-sm font-semibold text-white">{plan.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{plan.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Billing period */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Előfizetési időszak <span className="text-red-400">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(BILLING_LABELS) as [BillingKey, string][]).map(([key, label]) => {
                      const p = PRICING[selectedPlan][key];
                      return (
                        <button key={key} type="button" onClick={() => setSelectedBilling(key)}
                          className={cn('p-3 rounded-xl border text-left transition-all', selectedBilling === key ? 'border-white bg-white/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600')}>
                          <div className="text-sm font-semibold text-white">{label}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{fmt(p.monthly)} Ft/hó</div>
                          {key !== 'havi' && p.saving > 0 && <div className="text-xs text-emerald-400 mt-0.5">−{fmt(p.saving)} Ft/év</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price summary */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Csomag</span>
                    <span className="font-medium text-white">{PLAN_LABELS[selectedPlan]} — {BILLING_LABELS[selectedBilling]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Havi díj</span>
                    <span className="font-bold text-white text-base">{fmt(chosenPricing.monthly)} Ft / hó</span>
                  </div>
                  {selectedBilling !== 'havi' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fizetendő összeg</span>
                      <span className="font-bold text-white">{fmt(chosenPricing.total)} Ft</span>
                    </div>
                  )}
                  {chosenPricing.saving > 0 && (
                    <div className="flex justify-between border-t border-slate-700/60 pt-2 mt-2">
                      <span className="text-emerald-400">Megtakarítás</span>
                      <span className="font-bold text-emerald-400">{fmt(chosenPricing.saving)} Ft/év</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 border-t border-slate-700/60 pt-3 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs leading-relaxed font-medium">
                      Az igénylés jóváhagyása után <strong>díjbekérő fog érkezni</strong> a megadott email-címre. A fizetés beérkezése után aktiváljuk az éttermedet.
                    </p>
                  </div>
                </div>

                {/* Contact fields */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="business_name" className="text-xs font-medium text-slate-400">Étterem neve <span className="text-red-400">*</span></Label>
                    <Input id="business_name" name="business_name" value={form.business_name} onChange={handleChange} placeholder="pl. Kovács Vendéglő" required className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_name" className="text-xs font-medium text-slate-400">Kapcsolattartó neve <span className="text-red-400">*</span></Label>
                    <Input id="contact_name" name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Kovács János" required className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-slate-400">Email <span className="text-red-400">*</span></Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="janos@etterem.hu" required className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-slate-400">Telefonszám</Label>
                    <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+36 30 123 4567" className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-medium text-slate-400">Város</Label>
                    <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Budapest" className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-medium text-slate-400">Cím</Label>
                    <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="Fő utca 1." className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-medium text-slate-400">Üzenet / Egyéb info</Label>
                  <Textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder="Röviden mutasd be az éttermedet..." rows={3} className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 resize-none rounded-xl" />
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold text-base rounded-xl">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Küldés...</> : <>Igénylés Beküldése <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
                <p className="text-xs text-slate-600 text-center">Az igénylés elküldésével elfogadod az Általános Szerződési Feltételeinket.</p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 py-10 px-4 bg-[#080c14]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
              <img src="/image.png" alt="SYORDER" width={28} height={28} className="object-contain w-full h-full" />
            </div>
            <span className="font-bold text-white tracking-widest text-sm uppercase">SYORDER</span>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} SYORDER. Minden jog fenntartva.</p>
          <Link href="/login" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
            <LogIn className="h-3.5 w-3.5" /> Partner Belépés
          </Link>
        </div>
      </footer>
    </div>
  );
}
