'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

const features = [
  {
    icon: ShoppingBag,
    title: 'Valós idejű Rendeléskezelés',
    desc: 'Minden rendelés azonnal megjelenik és kezelhető az irányítópulton.',
  },
  {
    icon: Package,
    title: 'Okos Készletkövetés',
    desc: 'Automatikus riasztás 30% alatti készletnél, recept alapú fogyasztáskövetés.',
  },
  {
    icon: Users,
    title: 'Hűségprogram',
    desc: 'Pontgyűjtős hűségrendszer, VIP vendégek kezelése.',
  },
  {
    icon: BarChart3,
    title: 'Részletes Analitika',
    desc: 'Bevételi trendek, legjobban teljesítő tételek, időszaki összehasonlítás.',
  },
  {
    icon: Globe,
    title: 'Nyilvános Menüoldal',
    desc: 'Saját aldomainen megjeleníthető, márkázható online menü.',
  },
  {
    icon: Shield,
    title: 'Teljes Adatbiztonság',
    desc: 'Restaurant-szintű adatelszigeteltség, biztonságos multi-tenant architektúra.',
  },
];

const plans = [
  {
    name: 'Induló',
    price: '14 900',
    desc: 'Kis éttermek és büfék számára',
    features: ['1 helyszín', 'Korlátlan rendelés', 'Menükezelés', 'Alap analitika'],
    highlighted: false,
  },
  {
    name: 'Professzionális',
    price: '29 900',
    desc: 'Növekvő vendéglátóhelyek számára',
    features: [
      '1 helyszín',
      'Korlátlan rendelés',
      'Készletkezelés',
      'Hűségprogram',
      'Részletes analitika',
      'Prioritásos support',
    ],
    highlighted: true,
  },
  {
    name: 'Vállalati',
    price: 'Egyedi',
    desc: 'Lánc éttermek és franchise-ok számára',
    features: [
      'Több helyszín',
      'Minden funkció',
      'Egyedi integráció',
      'Dedikált account manager',
    ],
    highlighted: false,
  },
];

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState<PlatformStats>({
    activeRestaurants: 0,
    totalOrders: 0,
    avgRating: 0,
    satisfiedOwners: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Restaurant search state
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState<RestaurantResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Application form state
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const [tenantsRes, ordersRes, reviewsRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('platform_reviews').select('rating'),
      ]);

      const totalOrders = ordersRes.count || 0;
      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      const satisfiedOwners = reviews.filter((r) => r.rating >= 4).length;

      setStats({
        activeRestaurants: tenantsRes.count || 0,
        totalOrders,
        avgRating,
        satisfiedOwners,
      });
      setStatsLoading(false);
    })();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchName.trim() && !searchCity.trim()) {
      toast.error('Adj meg legalább egy keresési feltételt!');
      return;
    }
    setSearching(true);
    setSearchResults(null);

    let query = supabase
      .from('tenants')
      .select('id, name, slug, address, delivery_cities, cuisines, primary_color')
      .eq('is_active', true);

    if (searchName.trim()) {
      query = query.ilike('name', `%${searchName.trim()}%`);
    }
    if (searchCity.trim()) {
      // match restaurant's own city (address) OR delivery_cities array
      query = query.or(
        `address.ilike.%${searchCity.trim()}%,delivery_cities.cs.{"${searchCity.trim()}"}`
      );
    }

    const { data } = await query.limit(20);
    setSearchResults(data || []);
    setSearching(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name || !form.contact_name || !form.email) {
      toast.error('Kérjük, töltsd ki a kötelező mezőket!');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('restaurant_requests').insert({
        business_name: form.business_name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || null,
        city: form.city || null,
        address: form.address || null,
        message: form.message || null,
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

  const displayStats = [
    {
      value: statsLoading ? '...' : `${stats.activeRestaurants}`,
      label: 'Aktív étterem',
      sublabel: 'a platformon',
    },
    {
      value: statsLoading ? '...' : stats.totalOrders.toLocaleString('hu-HU'),
      label: 'Kezelt rendelés',
      sublabel: 'összesen',
    },
    {
      value: statsLoading ? '...' : (stats.satisfiedOwners > 0 ? `${stats.satisfiedOwners}` : '0'),
      label: 'Elégedett tulajdonos',
      sublabel: stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5 átlag` : '',
      isRating: stats.avgRating > 0,
      rating: stats.avgRating,
    },
    { value: '99.9%', label: 'Rendelkezésre állás', sublabel: 'garantált SLA' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Gemini_Generated_Image_gaqzzsgaqzzsgaqz.png"
              alt="SYORDER"
              width={36}
              height={36}
              className="rounded-md object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white">SYORDER</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#search" className="hover:text-white transition-colors">Étterem keresés</a>
            <a href="#features" className="hover:text-white transition-colors">Funkciók</a>
            <a href="#pricing" className="hover:text-white transition-colors">Árak</a>
            <a href="#igenyles" className="hover:text-white transition-colors">Igénylés</a>
          </div>
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
            >
              Partner Belépés
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-32 px-4">
        {/* Technical grid background */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-slate-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Logo large */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl scale-110" />
              <Image
                src="/Gemini_Generated_Image_gaqzzsgaqzzsgaqz.png"
                alt="SYORDER"
                width={120}
                height={120}
                className="relative rounded-2xl object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-sm text-slate-400 mb-8">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Magyar Vendéglátós SaaS Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
            Minden éttermed
            <br />
            <span className="bg-gradient-to-r from-slate-200 via-white to-slate-400 bg-clip-text text-transparent">
              egy helyen kezelve
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Valós idejű rendeléskezelés, okos készletkövetés, hűségprogram és
            részletes analitika — mindenféle telepítés nélkül.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#igenyles">
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 h-12 text-base font-semibold shadow-xl shadow-white/10"
              >
                Ingyenes Igénylés
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-700 text-slate-300 h-12 px-8 text-base hover:bg-slate-900 bg-transparent"
              >
                Funkciók megtekintése
              </Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-4xl mx-auto mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-800">
          {displayStats.map((s, i) => (
            <div
              key={s.label}
              className="bg-slate-900/80 px-6 py-7 text-center flex flex-col items-center justify-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{s.value}</div>
              {s.isRating && s.rating ? (
                <div className="flex items-center justify-center mb-1">
                  <StarRating value={s.rating} />
                </div>
              ) : null}
              <div className="text-sm text-slate-400 font-medium">{s.label}</div>
              {s.sublabel && (
                <div className="text-xs text-slate-600 mt-0.5">{s.sublabel}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Restaurant Finder */}
      <section id="search" className="py-20 px-4 bg-slate-900 border-y border-slate-800">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800 text-sm text-slate-400 mb-4">
              <Search className="h-3.5 w-3.5" />
              Étterem kereső
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Keres éttermet, ami szállít hozzád?
            </h2>
            <p className="text-slate-400">
              Keresés étteremnév és/vagy szállítási város alapján
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Étterem neve..."
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 h-11"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Szállítási város..."
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={searching}
              className="h-11 px-6 bg-white text-slate-900 hover:bg-slate-100 font-semibold shrink-0"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Keresés'}
            </Button>
          </form>

          {/* Search Results */}
          {searchResults !== null && (
            <div className="mt-6 space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-10 border border-slate-800 rounded-xl bg-slate-900/50">
                  <Search className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm">
                    Nem találtunk egyező éttermet. Próbálj más keresési feltételt!
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 px-1">
                    {searchResults.length} találat
                  </p>
                  {searchResults.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ backgroundColor: r.primary_color || '#334155' }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{r.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {r.address && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {r.address}
                            </span>
                          )}
                          {r.delivery_cities && r.delivery_cities.length > 0 && (
                            <span className="text-xs text-slate-400">
                              Szállítás: {r.delivery_cities.join(', ')}
                            </span>
                          )}
                        </div>
                        {r.cuisines && r.cuisines.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {r.cuisines.map((c) => (
                              <Badge key={c} variant="secondary" className="text-xs bg-slate-800 text-slate-300 border-slate-700 py-0">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link href={`/menu/${r.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent gap-1.5">
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

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Minden, amire szükséged van
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Professzionális vendéglátós szoftver, amely az éttermed teljes
              működését lefedi.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors shadow-none"
              >
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Hogyan működik?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Küldd be az igénylést',
                desc: 'Töltsd ki az alábbi űrlapot az éttermed alapadataival.',
                icon: ChefHat,
              },
              {
                step: '02',
                title: 'Aktiválás 24 órán belül',
                desc: 'Csapatunk feldolgozza a kérést és aktiválja az fiókodat.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Kezdd el használni',
                desc: 'Bejelentkezel és azonnal elkezdheted a rendelések kezelését.',
                icon: TrendingUp,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Áraink</h2>
            <p className="text-lg text-slate-400">Rejtett díjak nélkül, azonnali aktiválással.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border bg-slate-900 ${
                  plan.highlighted
                    ? 'border-slate-400 shadow-xl shadow-white/5 scale-[1.02]'
                    : 'border-slate-800'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-white text-slate-900 px-4 py-1 text-xs font-semibold">
                      Legnépszerűbb
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{plan.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      {plan.price === 'Egyedi' ? (
                        <span className="text-3xl font-extrabold text-white">Egyedi</span>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                          <span className="text-sm text-slate-500">Ft / hó</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#igenyles">
                    <Button
                      className={`w-full ${plan.highlighted ? 'bg-white text-slate-900 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent'}`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      Igénylés beküldése
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="igenyles" className="py-24 px-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800 text-sm text-slate-400 mb-4">
              Ingyenes Igénylés
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Csatlakozz a SYORDER-hez
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Küldd be az adataidat és 24 órán belül aktiváljuk az éttermedet.
            </p>
          </div>

          {submitted ? (
            <div className="border border-emerald-800 bg-emerald-950/50 rounded-2xl py-16 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-900/50 border border-emerald-800 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Igénylés beérkezett!</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Köszönjük! Csapatunk hamarosan felveszi veled a kapcsolatot a{' '}
                <strong className="text-white">{form.email}</strong> email-címen.
              </p>
            </div>
          ) : (
            <Card className="border border-slate-800 bg-slate-900/60">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="business_name" className="text-sm font-medium text-slate-300">
                        Étterem neve <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="business_name"
                        name="business_name"
                        value={form.business_name}
                        onChange={handleChange}
                        placeholder="pl. Kovács Vendéglő"
                        required
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact_name" className="text-sm font-medium text-slate-300">
                        Kapcsolattartó neve <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="contact_name"
                        name="contact_name"
                        value={form.contact_name}
                        onChange={handleChange}
                        placeholder="Kovács János"
                        required
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                        Email cím <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="janos@etterem.hu"
                        required
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-300">
                        Telefonszám
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+36 30 123 4567"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm font-medium text-slate-300">
                        Város
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Budapest"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-sm font-medium text-slate-300">
                        Cím
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Fő utca 1."
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm font-medium text-slate-300">
                      Üzenet / Egyéb info
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Röviden mutasd be az éttermedet: hány asztal, van-e kiszállítás, elvitel..."
                      rows={4}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-500 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base shadow-lg shadow-white/10"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Küldés...
                        </>
                      ) : (
                        <>
                          Igénylés Beküldése
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-600 text-center mt-3">
                      Az igénylés elküldésével elfogadod az Általános Szerződési
                      Feltételeinket. Szoftver aktiválás 24 órán belül.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/Gemini_Generated_Image_gaqzzsgaqzzsgaqz.png"
              alt="SYORDER"
              width={28}
              height={28}
              className="rounded object-contain"
            />
            <span className="font-bold text-white">SYORDER</span>
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} SYORDER. Minden jog fenntartva.
          </p>
          <Link href="/login" className="text-sm text-slate-500 hover:text-white transition-colors">
            Partner Belépés
          </Link>
        </div>
      </footer>
    </div>
  );
}
