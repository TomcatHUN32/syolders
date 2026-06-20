'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Utensils,
  Phone,
  MapPin,
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  ChevronRight,
} from 'lucide-react';
import { supabase, Tenant, MenuCategory, MenuItem } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function RestaurantPage() {
  const params = useParams();
  const slug = params.subdomain as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!tenantData) { setLoading(false); return; }
        setTenant(tenantData as Tenant);

        const [catsRes, itemsRes] = await Promise.all([
          supabase.from('menu_categories').select('*').eq('tenant_id', tenantData.id).eq('is_active', true).order('display_order'),
          supabase.from('menu_items').select('*').eq('tenant_id', tenantData.id).eq('is_available', true).order('display_order'),
        ]);

        setCategories(catsRes.data || []);
        setMenuItems(itemsRes.data || []);
      } catch (err) {
        console.error('Error loading restaurant:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
    toast.success(`${item.name} hozzáadva`);
  }

  function updateQty(item: MenuItem, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.item.id === item.id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
          .filter((c) => c.quantity > 0)
    );
  }

  const cartTotal = cart.reduce((s, c) => s + Number(c.item.price) * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter((i) => i.category_id === activeCategory);

  const byCategory = categories.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat.id] = filteredItems.filter((i) => i.category_id === cat.id);
    return acc;
  }, {});

  const uncategorized = filteredItems.filter((i) => !i.category_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <UtensilsCrossed className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Étterem nem található</h1>
        <p className="text-slate-500 text-center">
          Ez az étterem nem létezik vagy jelenleg nem elérhető.
        </p>
      </div>
    );
  }

  const primary = tenant.primary_color || '#1e293b';

  return (
    <div className="min-h-screen bg-slate-50" style={{ '--primary': primary } as React.CSSProperties}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primary }}
              >
                {tenant.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 leading-tight">{tenant.name}</p>
              {tenant.address && (
                <p className="text-xs text-slate-500 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" /> {tenant.address}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Kosár</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero band */}
      <div
        className="py-10 px-4"
        style={{ background: `linear-gradient(135deg, ${primary}18 0%, ${primary}08 100%)` }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{tenant.name}</h1>
          <p className="text-slate-500 text-sm">Online rendelés és menü</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
            {tenant.address && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tenant.address}</span>
            )}
            {tenant.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{tenant.phone}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-none">
            {[{ id: 'all', name: 'Összes' }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: primary, color: '#fff' }
                    : { backgroundColor: 'transparent', color: '#64748b' }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {menuItems.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-14 w-14 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">A menü hamarosan elérhető</h2>
            <p className="text-slate-400 text-sm">Ez az étterem még nem töltötte fel az ételeket.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => {
              const items = byCategory[cat.id] || [];
              if (items.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primary }} />
                    <h2 className="text-lg font-bold text-slate-900">{cat.name}</h2>
                    <span className="text-sm text-slate-400">{items.length} tétel</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => <MenuCard key={item.id} item={item} primary={primary} onAdd={addToCart} />)}
                  </div>
                </div>
              );
            })}

            {uncategorized.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-5 rounded-full bg-slate-300" />
                  <h2 className="text-lg font-bold text-slate-900">Egyéb tételek</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {uncategorized.map((item) => <MenuCard key={item.id} item={item} primary={primary} onAdd={addToCart} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating cart button (mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:hidden z-50">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-white font-semibold shadow-xl"
            style={{ backgroundColor: primary }}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {cartCount} tétel a kosárban
            </span>
            <span className="flex items-center gap-1">
              {cartTotal.toLocaleString('hu-HU')} Ft
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Rendelésed
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 min-h-0 mt-4">
            <ScrollArea className="flex-1">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">A kosarad üres</p>
                </div>
              ) : (
                <div className="space-y-3 pr-1">
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{cartItem.item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {Number(cartItem.item.price).toLocaleString('hu-HU')} Ft / db
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(cartItem.item, -1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateQty(cartItem.item, 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setCart((p) => p.filter((c) => c.item.id !== cartItem.item.id))}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors ml-1"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Összesen</span>
                  <span className="text-xl font-bold text-slate-900">
                    {cartTotal.toLocaleString('hu-HU')} Ft
                  </span>
                </div>
                <button
                  className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primary }}
                  onClick={() => toast.info('Online rendelés hamarosan elérhető!')}
                >
                  Rendelés leadása
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MenuCard({
  item,
  primary,
  onAdd,
}: {
  item: MenuItem;
  primary: string;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-shadow">
      {item.image_url ? (
        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center">
          <Utensils className="h-8 w-8 text-slate-300" />
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-900">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        {item.preparation_time_minutes ? (
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.preparation_time_minutes} perc
          </p>
        ) : null}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold" style={{ color: primary }}>
            {Number(item.price).toLocaleString('hu-HU')} Ft
          </span>
          <button
            onClick={() => onAdd(item)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <Plus className="h-3.5 w-3.5" />
            Kosárba
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
