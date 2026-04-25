'use client';
// src/app/(dashboard)/dashboard/page.tsx
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { BookingCard } from '@/components/bookings/BookingCard';
import { CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Booking, PaginatedResponse } from '@/types';

export default function UserDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['user-bookings', 'recent'],
    queryFn: () => bookingApi.list({ per_page: 5 }).then(r => r.data as PaginatedResponse<Booking>),
  });

  const bookings = data?.data ?? [];
  const total        = data?.total ?? 0;
  const upcoming     = bookings.filter(b => ['pending','confirmed'].includes(b.status)).length;
  const completed    = bookings.filter(b => b.status === 'completed').length;
  const cancelled    = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's a snapshot of your appointments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CalendarDays, label: 'Total Bookings',  value: total,     color: 'text-brand-600',  bg: 'bg-brand-50' },
          { icon: Clock,        label: 'Upcoming',        value: upcoming,  color: 'text-blue-600',   bg: 'bg-blue-50' },
          { icon: CheckCircle,  label: 'Completed',       value: completed, color: 'text-green-600',  bg: 'bg-green-50' },
          { icon: XCircle,      label: 'Cancelled',       value: cancelled, color: 'text-red-500',    bg: 'bg-red-50' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div className="stat-value">{isLoading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-display text-gray-900">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-brand-600 font-medium hover:text-brand-700">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="card p-5 skeleton h-24" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">No bookings yet</h3>
            <p className="text-sm text-gray-400 mb-4">Start by discovering services near you</p>
            <Link href="/providers" className="btn-primary">Browse Providers</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
