'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Store,
  Palette,
  Globe,
  Save,
  Eye,
  CreditCard,
} from 'lucide-react';
import { supabase, Tenant } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Restaurant settings
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Branding settings
  const [primaryColor, setPrimaryColor] = useState('#1E40AF');
  const [secondaryColor, setSecondaryColor] = useState('#3B82F6');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('tenant:tenants(*)')
        .eq('id', user.id)
        .single();

      if (data?.tenant) {
        const tenantData = Array.isArray(data.tenant) ? data.tenant[0] : data.tenant;
        if (tenantData) {
          setTenant(tenantData as Tenant);
          setRestaurantName(tenantData.name);
          setRestaurantSlug(tenantData.slug);
          setAddress(tenantData.address || '');
          setPhone(tenantData.phone || '');
          setEmail(tenantData.email || '');
          setPrimaryColor(tenantData.primary_color);
          setSecondaryColor(tenantData.secondary_color);
          setAccentColor(tenantData.accent_color);
          setLogoUrl(tenantData.logo_url || '');
        }
      }
    } catch (error) {
      console.error('Hiba a beállítások betöltésekor:', error);
      toast.error('Nem sikerült betölteni a beállításokat');
    } finally {
      setLoading(false);
    }
  }

  async function saveRestaurantSettings() {
    if (!tenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: restaurantName,
          slug: restaurantSlug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          address,
          phone,
          email,
        })
        .eq('id', tenant.id);

      if (error) throw error;
      toast.success('Étterem beállítások elmentve');
      loadSettings();
    } catch (error) {
      console.error('Hiba a mentéskor:', error);
      toast.error('Nem sikerült menteni a beállításokat');
    } finally {
      setSaving(false);
    }
  }

  async function saveBrandingSettings() {
    if (!tenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          logo_url: logoUrl || null,
        })
        .eq('id', tenant.id);

      if (error) throw error;
      toast.success('Márka beállítások elmentve');
    } catch (error) {
      console.error('Hiba a mentéskor:', error);
      toast.error('Nem sikerült menteni a márka beállításokat');
    } finally {
      setSaving(false);
    }
  }

  const presetColors = [
    { name: 'Ocean Blue', primary: '#1E40AF', secondary: '#3B82F6', accent: '#F59E0B' },
    { name: 'Forest Green', primary: '#166534', secondary: '#22C55E', accent: '#F97316' },
    { name: 'Royal Burgundy', primary: '#881337', secondary: '#E11D48', accent: '#FBBF24' },
    { name: 'Dark Charcoal', primary: '#27272A', secondary: '#52525B', accent: '#F59E0B' },
    { name: 'Sunset Orange', primary: '#C2410C', secondary: '#EA580C', accent: '#84CC16' },
    { name: 'Deep Purple', primary: '#581C87', secondary: '#A855F7', accent: '#FCD34D' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fejléc */}
      <div>
        <h1 className="text-3xl font-bold">Beállítások</h1>
        <p className="text-muted-foreground">
          Szabd testre az étterem profilját és beállításait
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="restaurant">
        <TabsList>
          <TabsTrigger value="restaurant">
            <Store className="h-4 w-4 mr-2" />
            Étterem
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Márka
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Előfizetés
          </TabsTrigger>
        </TabsList>

        {/* Étterem beállítások */}
        <TabsContent value="restaurant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Étterem Információk</CardTitle>
              <CardDescription>
                Alapvető adatok az étteremről
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Étterem Neve</Label>
                  <Input
                    id="name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Éttermem"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Elérés</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      falathaz.com/menu/
                    </span>
                    <Input
                      id="slug"
                      value={restaurantSlug}
                      onChange={(e) =>
                        setRestaurantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder="ettermem"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Cím</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Fő utca, Város, Ország"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonszám</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+36 1 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Cím</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@ettermem.hu"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  A menüd elérhető lesz:{' '}
                  <a
                    href={`/menu/${restaurantSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    /menu/{restaurantSlug}
                  </a>
                </div>
                <Button onClick={saveRestaurantSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Mentés...' : 'Változások Mentése'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Menü előnézet link */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Nyilvános Menüd</h3>
                  <p className="text-sm text-muted-foreground">
                    Oszd meg ezt a linket a vendégeiddel
                  </p>
                </div>
                <Button asChild>
                  <a href={`/menu/${restaurantSlug}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    Menü Megtekintése
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Márka beállítások */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Színséma</CardTitle>
              <CardDescription>
                Szabd testre a menüd megjelenését a márkaszíneiddel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Előre beállított színek */}
              <div className="space-y-2">
                <Label>Gyors Beállítások</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setPrimaryColor(preset.primary);
                        setSecondaryColor(preset.secondary);
                        setAccentColor(preset.accent);
                      }}
                      className="p-2 rounded-lg border hover:border-primary transition-colors"
                    >
                      <div className="flex gap-1 mb-2 justify-center">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Egyéni színek */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Elsődleges Szín</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Másodlagos Szín</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Kiemelő Szín</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#F59E0B"
                    />
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://pelda.hu/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Add meg az étterem logójának URL-jét
                </p>
              </div>

              {/* Előnézet */}
              <div className="p-6 rounded-lg border-2 border-dashed">
                <p className="text-sm text-muted-foreground mb-3">Előnézet</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    className="px-6 py-2 rounded-lg text-white font-medium shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Elsődleges Gomb
                  </button>
                  <button
                    className="px-6 py-2 rounded-lg text-white font-medium shadow-sm"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Másodlagos Gomb
                  </button>
                  <button
                    className="px-6 py-2 rounded-lg text-white font-medium shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    Kiemelő Gomb
                  </button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={saveBrandingSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Mentés...' : 'Márka Mentése'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Előfizetés */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Előfizetési Csomag</CardTitle>
              <CardDescription>
                Kezeld az előfizetésedet és számlázást
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Badge className="bg-primary mb-2">Professzionális</Badge>
                  <div className="text-2xl font-bold">29,900 Ft / hónap</div>
                  <p className="text-sm text-muted-foreground">
                    Korlátlan étterem, rendelés és funkciók
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  Megújítás: {new Date().toLocaleDateString('hu-HU')}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Jelenlegi Funkciók</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Korlátlan Étterem
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Korlátlan Rendelés
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Készletkezelés
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Hűségprogram
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Analitika Dashboard
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Prioritásos Támogatás
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline">Csomag Váltása</Button>
                <Button variant="destructive" className="ml-auto">
                  Előfizetés Törlése
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Számlázási történet */}
          <Card>
            <CardHeader>
              <CardTitle>Számlázási Történet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: '2024-06-20', amount: '29,900 Ft', status: 'Fizetve' },
                  { date: '2024-05-20', amount: '29,900 Ft', status: 'Fizetve' },
                  { date: '2024-04-20', amount: '29,900 Ft', status: 'Fizetve' },
                ].map((invoice, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{invoice.amount}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('hu-HU')}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-success">
                      {invoice.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
