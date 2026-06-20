'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Utensils,
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
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

const stats = [
  { value: '500+', label: 'Aktív étterem' },
  { value: '2M+', label: 'Kezelt rendelés' },
  { value: '99.9%', label: 'Rendelkezésre állás' },
  { value: '24/7', label: 'Support' },
];

export default function LandingPage() {
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SYORDER</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Funkciók</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Árak</a>
            <a href="#apply" className="hover:text-slate-900 transition-colors">Igénylés</a>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              Partner Belépés
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100/60" />
        {/* decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-sm text-slate-600 mb-8">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Magyar Vendéglátós SaaS Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Minden éttermed
            <br />
            <span className="relative">
              <span className="text-slate-600">egy helyen kezelve</span>
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Valós idejű rendeléskezelés, okos készletkövetés, hűségprogram és
            részletes analitika — mindenféle telepítés nélkül.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#apply">
              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-slate-900/20"
              >
                Ingyenes Igénylés
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-200 text-slate-700 h-12 px-8 text-base hover:bg-slate-50"
              >
                Funkciók megtekintése
              </Button>
            </a>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Minden, amire szükséged van
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Professzionális vendéglátós szoftver, amely az éttermed teljes
              működését lefedi.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
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
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Áraink</h2>
            <p className="text-lg text-slate-500">Rejtett díjak nélkül, azonnali aktiválással.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border bg-white ${
                  plan.highlighted
                    ? 'border-slate-900 shadow-xl shadow-slate-900/10 scale-[1.02]'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-slate-900 text-white px-4 py-1 text-xs font-semibold">
                      Legnépszerűbb
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{plan.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      {plan.price === 'Egyedi' ? (
                        <span className="text-3xl font-extrabold text-slate-900">Egyedi</span>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold text-slate-900">
                            {plan.price}
                          </span>
                          <span className="text-sm text-slate-400">Ft / hó</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#apply">
                    <Button
                      className="w-full"
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
      <section id="apply" className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600 mb-4">
              Ingyenes Igénylés
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Csatlakozz a SYORDER-hez
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Küldd be az adataidat és 24 órán belül aktiváljuk az éttermedet.
            </p>
          </div>

          {submitted ? (
            <Card className="border border-emerald-200 bg-emerald-50">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Igénylés beérkezett!
                </h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  Köszönjük! Csapatunk hamarosan felveszi veled a kapcsolatot a{' '}
                  <strong>{form.email}</strong> email-címen.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="business_name" className="text-sm font-medium text-slate-700">
                        Étterem neve <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="business_name"
                        name="business_name"
                        value={form.business_name}
                        onChange={handleChange}
                        placeholder="pl. Kovács Vendéglő"
                        required
                        className="border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact_name" className="text-sm font-medium text-slate-700">
                        Kapcsolattartó neve <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_name"
                        name="contact_name"
                        value={form.contact_name}
                        onChange={handleChange}
                        placeholder="Kovács János"
                        required
                        className="border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email cím <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="janos@etterem.hu"
                        required
                        className="border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                        Telefonszám
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+36 30 123 4567"
                        className="border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                        Város
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Budapest"
                        className="border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                        Cím
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Fő utca 1."
                        className="border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                      Üzenet / Egyéb info
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Röviden mutasd be az éttermedet: hány asztal, van-e kiszállítás, elvitel..."
                      rows={4}
                      className="border-slate-200 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base shadow-lg shadow-slate-900/20"
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
                    <p className="text-xs text-slate-400 text-center mt-3">
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
      <footer className="border-t border-slate-100 py-12 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <Utensils className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">SYORDER</span>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} SYORDER. Minden jog fenntartva.
          </p>
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Partner Belépés
          </Link>
        </div>
      </footer>
    </div>
  );
}
