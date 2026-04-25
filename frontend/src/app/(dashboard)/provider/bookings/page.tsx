'use client';
// src/app/(dashboard)/provider/bookings/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '@/lib/api';
import { bookingStatusConfig, cn, formatBookingDate, formatTime, formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, UserCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Booking, PaginatedResponse } from '@/types';

export default function ProviderBookingsPage() {
  const [status, setStatus] = useState('');
  const [date, setDate]     = useState('');
  const [page, setPage]     = useState(1);
  const [cancelModal, setCancelModal] = useState<{ id: number } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-bookings', status, date, page],
    queryFn: () => providerApi.myBookings({ status: status || undefined, date: date || undefined, page }).then(r => r.data as PaginatedResponse<Booking>),
    placeholderData: (p) => p,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      providerApi.updateBookingStatus(id, { status, reason }),
    onSuccess: (_, vars) => {
      toast.success(`Booking ${vars.status}.`);
      qc.invalidateQueries({ queryKey: ['provider-bookings'] });
      qc.invalidateQueries({ queryKey: ['provider-dashboard'] });
      setCancelModal(null);
      setCancelReason('');
    },
    onError: () => toast.error('Action failed.'),
  });

  const ACTION_BTNS: Record<string, Array<{ label: string; newStatus: string; icon: any; cls: string }>> = {
    pending:   [
      { label: 'Confirm',  newStatus: 'confirmed', icon: CheckCircle, cls: 'text-green-600 hover:bg-green-50' },
      { label: 'Cancel',   newStatus: 'cancelled', icon: XCircle,     cls: 'text-red-500 hover:bg-red-50' },
    ],
    confirmed: [
      { label: 'Complete', newStatus: 'completed', icon: UserCheck,   cls: 'text-blue-600 hover:bg-blue-50' },
      { label: 'No Show',  newStatus: 'no_show',   icon: Clock,       cls: 'text-gray-500 hover:bg-gray-100' },
      { label: 'Cancel',   newStatus: 'cancelled', icon: XCircle,     cls: 'text-red-500 hover:bg-red-50' },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">View and manage all customer appointments.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Statuses</option>
          {Object.entries(bookingStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} className="input w-auto" />
        {(status || date) && (
          <button onClick={() => { setStatus(''); setDate(''); setPage(1); }} className="btn-ghost btn-sm text-red-500">Clear</button>
        )}
      </div>

      {/* Bookings list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="card p-5 skeleton h-24" />)}</div>
      ) : data?.data?.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No bookings found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.data?.map((b: Booking) => {
            const st = bookingStatusConfig[b.status];
            const actions = ACTION_BTNS[b.status] ?? [];
            return (
              <div key={b.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date block */}
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center shrink-0 text-brand-700">
                    <span className="text-xs font-semibold">{formatBookingDate(b.booking_date).slice(0,3)}</span>
                    <span className="text-xl font-extrabold leading-none">{new Date(b.booking_date).getDate()}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900">{b.user?.name}</span>
                      <span className={cn('badge border text-xs', st.bg, st.color)}>{st.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{b.service?.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      <span>⏰ {formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                      {b.user?.phone && <span>📞 {b.user.phone}</span>}
                      <span className="font-mono">{b.booking_reference}</span>
                    </div>
                    {b.notes && <p className="text-xs text-gray-500 mt-1.5 italic">"{b.notes}"</p>}
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(b.service_price)}</p>
                    {actions.length > 0 && (
                      <div className="flex gap-1">
                        {actions.map(a => {
                          const Icon = a.icon;
                          return (
                            <button
                              key={a.newStatus}
                              disabled={isPending}
                              onClick={() => {
                                if (a.newStatus === 'cancelled') { setCancelModal({ id: b.id }); }
                                else updateStatus({ id: b.id, status: a.newStatus });
                              }}
                              className={`btn-ghost btn-sm gap-1 text-xs ${a.cls}`}
                            >
                              <Icon size={13} /> {a.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">{page} / {data?.last_page}</span>
          <button disabled={page === data?.last_page} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for the customer.</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Reason for cancellation…" className="input resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => updateStatus({ id: cancelModal.id, status: 'cancelled', reason: cancelReason })} disabled={!cancelReason.trim() || isPending} className="btn-danger flex-1 disabled:opacity-50">
                Confirm Cancel
              </button>
              <button onClick={() => { setCancelModal(null); setCancelReason(''); }} className="btn-secondary flex-1">Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
