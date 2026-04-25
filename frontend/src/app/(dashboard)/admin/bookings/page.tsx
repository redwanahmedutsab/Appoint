'use client';
// src/app/(dashboard)/admin/bookings/page.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, bookingStatusConfig, cn } from '@/lib/utils';
import { Search, CalendarDays } from 'lucide-react';
import { Booking, BookingStatus, PaginatedResponse } from '@/types';

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', search, status, page],
    queryFn: () =>
      adminApi.bookings({ search: search || undefined, status: status || undefined, page })
        .then(r => r.data as PaginatedResponse<Booking>),
    placeholderData: p => p,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">All appointments across the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-card">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customer or provider…"
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          {(Object.keys(bookingStatusConfig) as BookingStatus[]).map(s => (
            <option key={s} value={s}>{bookingStatusConfig[s].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Reference</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Provider</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Service</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Amount</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <CalendarDays size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400">No bookings found</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((b: Booking) => {
                  const st = bookingStatusConfig[b.status];
                  return (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          #{b.booking_reference}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{b.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400 hidden sm:block">{b.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-gray-700">{b.provider?.business_name ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-600">
                        {b.service?.name ?? '—'}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-400 text-xs">
                        {b.booking_date ? formatDate(b.booking_date) : '—'}
                        {b.start_time && <span className="block">{b.start_time}</span>}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-right font-semibold text-gray-900">
                        {formatCurrency(b.service_price)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('badge border text-xs', st?.bg, st?.color)}>
                          {st?.label ?? b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data?.total} bookings total</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500">{page} / {data?.last_page}</span>
              <button disabled={page === data?.last_page} onClick={() => setPage(p => p + 1)}
                className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
