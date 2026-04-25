'use client';
// src/app/(dashboard)/dashboard/bookings/page.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api';
import { BookingCard } from '@/components/bookings/BookingCard';
import { bookingStatusConfig } from '@/lib/utils';
import { Booking, PaginatedResponse } from '@/types';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function UserBookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['user-bookings', status, page],
    queryFn: () => bookingApi.list({ status: status || undefined, page }).then(r => r.data as PaginatedResponse<Booking>),
    placeholderData: (p) => p,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">All your appointment history.</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'All' }, ...Object.entries(bookingStatusConfig).map(([k, v]) => ({ value: k, label: v.label }))].map(opt => (
          <button
            key={opt.value}
            onClick={() => { setStatus(opt.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${status === opt.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="card p-5 skeleton h-24" />)}</div>
      ) : data?.data?.length === 0 ? (
        <div className="card p-16 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-400 mb-4">You haven't made any bookings yet</p>
          <Link href="/providers" className="btn-primary">Browse Providers</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data?.data?.map((b: Booking) => <BookingCard key={b.id} booking={b} />)}
          </div>
          {(data?.last_page ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500">{page} / {data?.last_page}</span>
              <button disabled={page === data?.last_page} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
