'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { supabase, Tenant, MenuCategory, MenuItem } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderingEnabled, setOrderingEnabled] = useState(false);

  useEffect(() => {
    loadMenu();
  }, [slug]);

  function loadMenu() {
    (async () => {
      try {
        // Get tenant by slug
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (!tenantData) {
          setLoading(false);
          return;
        }

        setTenant(tenantData as Tenant);

        // Get categories
        const { data: categoriesData } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)
          .order('display_order');

        setCategories(categoriesData || []);

        // Get menu items
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('is_available', true)
          .order('display_order');

        setMenuItems(itemsData || []);

      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    })();
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    toast.success(`${item.name} hozzáadva a kosárhoz`);
  }

  function updateQuantity(item: MenuItem, delta: number) {
    setCart((prev) => {
      return prev
        .map((c) =>
          c.item.id === item.id
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0);
    });
  }

  function removeFromCart(item: MenuItem) {
    setCart((prev) => prev.filter((c) => c.item.id !== item.id));
  }

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.item.price) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category_id === activeCategory;
  });

  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = filteredItems.filter((item) => item.category_id === cat.id);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const uncategorizedItems = filteredItems.filter((item) => !item.category_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Étterem Nem Található</h1>
        <p className="text-muted-foreground text-center mb-4">
          A keresett étterem nem létezik vagy nem elérhető.
        </p>
        <Link href="/">
          <Button variant="outline">Ugrás a Főoldalra</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        '--tenant-primary': tenant.primary_color,
        '--tenant-secondary': tenant.secondary_color,
        '--tenant-accent': tenant.accent_color,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: tenant.primary_color }}
                >
                  {tenant.name.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-lg">{tenant.name}</span>
            </div>

            {orderingEnabled && (
              <Button
                className="relative"
                style={{ backgroundColor: tenant.primary_color }}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Kosár
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="py-16"
        style={{
          background: `linear-gradient(135deg, ${tenant.primary_color}15, ${tenant.secondary_color}10)`,
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{tenant.name}</h1>
          <p className="text-muted-foreground">Tekintsd meg finom menünket</p>

          {(tenant.address || tenant.phone) && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              {tenant.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tenant.address}
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {tenant.phone}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 py-3">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === 'all'
                    ? 'text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                style={
                  activeCategory === 'all'
                    ? { backgroundColor: tenant.primary_color }
                    : undefined
                }
              >
                Összes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                  style={
                    activeCategory === cat.id
                      ? { backgroundColor: tenant.primary_color }
                      : undefined
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Menu */}
      <main className="container mx-auto px-4 py-8">
        {menuItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Menü Hamarosan</h2>
            <p className="text-muted-foreground">
              Ez az étterem még nem adott hozzá tételeket.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Render by category */}
            {categories.map((cat) => {
              const items = itemsByCategory[cat.id] || [];
              if (items.length === 0) return null;

              return (
                <div key={cat.id}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <div
                      className="w-1 h-6 rounded"
                      style={{ backgroundColor: tenant.accent_color }}
                    />
                    {cat.name}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {item.image_url ? (
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full bg-muted flex items-center justify-center">
                            <Utensils className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {item.preparation_time_minutes && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                  <Clock className="h-3 w-3" />
                                  {item.preparation_time_minutes} min
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div
                                className="font-bold text-lg"
                                style={{ color: tenant.primary_color }}
                              >
                                {Number(item.price).toLocaleString('hu-HU')} Ft
                              </div>
                            </div>
                          </div>
                          {orderingEnabled && (
                            <Button
                              className="w-full mt-3"
                              style={{ backgroundColor: tenant.primary_color }}
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Rendeléshez Adás
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Kategorizálatlan tételek */}
            {uncategorizedItems.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Egyéb Tételek</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {uncategorizedItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <div
                            className="font-bold"
                            style={{ color: tenant.primary_color }}
                          >
                            {Number(item.price).toLocaleString('hu-HU')} Ft
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lábléc */}
      <footer className="border-t py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Üzemeltető: Falathaz - Étteremkezelő Platform</p>
        </div>
      </footer>

      {/* Kosár Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Rendelésed</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-6 px-6">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>A kosarad üres</p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{cartItem.item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {Number(cartItem.item.price).toLocaleString('hu-HU')} Ft / db
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(cartItem.item, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {cartItem.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(cartItem.item, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(cartItem.item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Összesen</span>
                  <span>{cartTotal.toLocaleString('hu-HU')} Ft</span>
                </div>
                <Button
                  className="w-full"
                  style={{ backgroundColor: tenant.primary_color }}
                >
                  Rendelés Leadása
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
