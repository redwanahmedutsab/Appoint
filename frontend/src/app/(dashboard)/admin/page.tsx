'use client';
// src/app/(dashboard)/admin/page.tsx
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, bookingStatusConfig, approvalStatusConfig, cn } from '@/lib/utils';
import { Users, Building2, CalendarDays, DollarSign, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data),
    refetchInterval: 60000,
  });

  const s = data?.stats;

  const statCards = [
    { icon: Users,       label: 'Total Users',       value: s?.total_users,        color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/admin/users' },
    { icon: Building2,   label: 'Total Providers',   value: s?.total_providers,    color: 'text-violet-600', bg: 'bg-violet-50', href: '/admin/providers' },
    { icon: Clock,       label: 'Pending Approval',  value: s?.pending_providers,  color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/admin/providers?status=pending' },
    { icon: CalendarDays,label: 'Today Bookings',    value: s?.today_bookings,     color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/bookings' },
    { icon: TrendingUp,  label: 'Monthly Revenue',   value: s ? formatCurrency(s.monthly_revenue) : '—', color: 'text-brand-600', bg: 'bg-brand-50', href: '/admin/commissions' },
    { icon: DollarSign,  label: 'Pending Commission',value: s ? formatCurrency(s.pending_commission) : '—', color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/commissions' },
    { icon: CheckCircle, label: 'Completed Bookings',value: s?.completed_bookings, color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/bookings?status=completed' },
    { icon: AlertCircle, label: 'Open Disputes',     value: s?.open_disputes,      color: 'text-red-600',    bg: 'bg-red-50',    href: '/admin/disputes' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and management.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="stat-card hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div className="stat-value">{isLoading ? '—' : s.value ?? '0'}</div>
              <div className="stat-label">{s.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending providers */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold font-display text-gray-900">Pending Approvals</h2>
            <Link href="/admin/providers?status=pending" className="text-xs text-brand-600 font-medium">View all →</Link>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : data?.pending_providers?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No pending approvals 🎉</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data?.pending_providers?.map((p: any) => (
                <Link key={p.id} href={`/admin/providers/${p.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                    {p.business_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.business_name}</p>
                    <p className="text-xs text-gray-500">{p.category?.name} · {p.user?.email}</p>
                  </div>
                  <span className="badge bg-amber-50 text-amber-700 border-amber-100 text-xs">Pending</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold font-display text-gray-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-brand-600 font-medium">View all →</Link>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : data?.recent_bookings?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No bookings yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data?.recent_bookings?.map((b: any) => {
                const status = bookingStatusConfig[b.status as keyof typeof bookingStatusConfig];
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{b.provider?.business_name} · {b.service?.name}</p>
                    </div>
                    <span className={cn('badge border text-xs', status?.bg, status?.color)}>{status?.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
