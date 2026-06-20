'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface Stats {
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activePartners: number;
}

interface RecentRequest {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  city: string | null;
  status: string;
  created_at: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    activePartners: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [requestsRes, partnersRes] = await Promise.all([
      supabase.from('restaurant_requests').select('status'),
      supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const requests = requestsRes.data || [];
    setStats({
      pendingRequests: requests.filter((r) => r.status === 'pending').length,
      approvedRequests: requests.filter((r) => r.status === 'approved').length,
      rejectedRequests: requests.filter((r) => r.status === 'rejected').length,
      activePartners: partnersRes.count || 0,
    });

    const { data: recent } = await supabase
      .from('restaurant_requests')
      .select('id, business_name, contact_name, email, city, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentRequests(recent || []);
    setLoading(false);
  }

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Függőben', variant: 'secondary' },
    approved: { label: 'Jóváhagyva', variant: 'default' },
    rejected: { label: 'Elutasítva', variant: 'destructive' },
  };

  const statCards = [
    {
      title: 'Függő Igénylések',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/admin/requests',
    },
    {
      title: 'Aktív Partnerek',
      value: stats.activePartners,
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/admin/partners',
    },
    {
      title: 'Jóváhagyott',
      value: stats.approvedRequests,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/requests',
    },
    {
      title: 'Elutasított',
      value: stats.rejectedRequests,
      icon: XCircle,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      href: '/admin/requests',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Áttekintés</h1>
        <p className="text-slate-500 mt-1">SYORDER platform állapota</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            Legutóbbi Igénylések
          </CardTitle>
          <Link href="/admin/requests">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900">
              Összes <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {recentRequests.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Még nincs beérkező igénylés</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((req) => {
                const status = statusConfig[req.status] || { label: req.status, variant: 'outline' as const };
                return (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{req.business_name}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {req.contact_name} · {req.email}
                        {req.city && ` · ${req.city}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(req.created_at).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform trend placeholder */}
      <Card className="border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-700">Platform Analytics</p>
            <p className="text-sm text-slate-400">Részletes statisztikák hamarosan elérhetők</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
