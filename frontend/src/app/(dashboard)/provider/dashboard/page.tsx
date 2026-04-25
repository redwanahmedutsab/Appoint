'use client';
// src/app/(dashboard)/provider/dashboard/page.tsx
import { useQuery } from '@tanstack/react-query';
import { providerApi } from '@/lib/api';
import { formatCurrency, bookingStatusConfig, cn, formatBookingDate, formatTime } from '@/lib/utils';
import { CalendarDays, Star, DollarSign, Clock, TrendingUp, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Booking } from '@/types';

export default function ProviderDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: () => providerApi.dashboard().then(r => r.data),
    refetchInterval: 30000,
  });

  const s = data?.stats;

  const statCards = [
    { icon: CalendarDays, label: 'Total Bookings',     value: s?.total_bookings,                  color: 'text-brand-600',   bg: 'bg-brand-50' },
    { icon: Clock,        label: 'Today',              value: s?.today_bookings,                  color: 'text-blue-600',    bg: 'bg-blue-50' },
    { icon: Users,        label: 'Upcoming',           value: s?.upcoming_bookings,               color: 'text-violet-600',  bg: 'bg-violet-50' },
    { icon: CheckCircle,  label: 'Pending Confirm',    value: s?.pending_bookings,                color: 'text-amber-600',   bg: 'bg-amber-50' },
    { icon: DollarSign,   label: 'Weekly Revenue',     value: s ? formatCurrency(s.weekly_revenue)     : '—', color: 'text-green-600',   bg: 'bg-green-50' },
    { icon: TrendingUp,   label: 'Pending Commission', value: s ? formatCurrency(s.pending_commission) : '—', color: 'text-orange-600',  bg: 'bg-orange-50' },
    { icon: Star,         label: 'Rating',             value: s?.average_rating ? `${s.average_rating} ★` : 'New', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Users,        label: 'Total Reviews',      value: s?.total_reviews,                   color: 'text-gray-600',    bg: 'bg-gray-100' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Provider Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your bookings and business performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div className="stat-value">{isLoading ? '—' : s.value ?? '0'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Upcoming bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-display text-gray-900">Upcoming Appointments</h2>
          <Link href="/provider/bookings" className="text-sm text-brand-600 font-medium hover:text-brand-700">View all →</Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="card p-5 skeleton h-20" />)}</div>
        ) : data?.upcoming_bookings?.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">No upcoming appointments</h3>
            <p className="text-sm text-gray-400">Your upcoming bookings will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data?.upcoming_bookings?.map((b: Booking) => {
              const st = bookingStatusConfig[b.status];
              return (
                <div key={b.id} className="card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex flex-col items-center justify-center shrink-0 text-brand-700 border border-brand-100">
                    <span className="text-xs font-bold">{formatBookingDate(b.booking_date).slice(0, 3)}</span>
                    <span className="text-sm font-extrabold leading-none">{new Date(b.booking_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{b.user?.name}</p>
                    <p className="text-xs text-gray-500">{b.service?.name} · {formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                    {b.user?.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {b.user.phone}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn('badge border text-xs', st.bg, st.color)}>{st.label}</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(b.service_price)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/provider/services',     label: 'Manage Services',      desc: 'Add, edit or remove your service offerings', color: 'from-brand-500 to-brand-700' },
          { href: '/provider/availability', label: 'Set Availability',     desc: 'Generate time slots for your calendar',       color: 'from-violet-500 to-violet-700' },
          { href: '/provider/bookings',     label: 'All Bookings',         desc: 'View and manage all appointment requests',    color: 'from-emerald-500 to-emerald-700' },
        ].map(l => (
          <Link key={l.href} href={l.href} className={`rounded-2xl bg-gradient-to-br ${l.color} text-white p-5 hover:scale-[1.02] transition-transform`}>
            <p className="font-bold mb-1">{l.label}</p>
            <p className="text-xs opacity-80 leading-relaxed">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
