'use client';
// src/app/(dashboard)/dashboard/bookings/[id]/page.tsx
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api';
import { bookingStatusConfig, cn, formatBookingDate, formatTime, formatCurrency, formatDate } from '@/lib/utils';
import { Star, ChevronLeft, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import Link from 'next/link';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const qc      = useQueryClient();

  const [showCancelForm,  setShowCancelForm]  = useState(false);
  const [showReviewForm,  setShowReviewForm]  = useState(false);
  const [cancelReason,    setCancelReason]    = useState('');
  const [rating,          setRating]          = useState(5);
  const [reviewText,      setReviewText]      = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.show(Number(id)).then(r => r.data.booking),
  });

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: () => bookingApi.cancel(Number(id), cancelReason),
    onSuccess: () => {
      toast.success('Booking cancelled.');
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['user-bookings'] });
      setShowCancelForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cancellation failed.'),
  });

  const { mutate: submitReview, isPending: reviewing } = useMutation({
    mutationFn: () => bookingApi.review(Number(id), { rating, review_text: reviewText }),
    onSuccess: () => {
      toast.success('Review submitted! Thank you 🙏');
      qc.invalidateQueries({ queryKey: ['booking', id] });
      setShowReviewForm(false);
    },
    onError: () => toast.error('Failed to submit review.'),
  });

  if (isLoading) return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="skeleton h-10 w-48 rounded-xl" />
      <div className="card p-6 skeleton h-48 rounded-2xl" />
    </div>
  );

  if (!data) return <div className="text-center py-16 text-gray-400">Booking not found.</div>;

  const booking = data;
  const st = bookingStatusConfig[booking.status];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back */}
      <Link href="/dashboard/bookings" className="btn-ghost btn-sm self-start">
        <ChevronLeft size={16} /> Back to Bookings
      </Link>

      {/* Main card */}
      <div className="card p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-1">{booking.booking_reference}</p>
            <h1 className="text-xl font-bold font-display text-gray-900">{booking.service?.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{booking.provider?.business_name}</p>
          </div>
          <span className={cn('badge border text-sm py-1 px-3', st.bg, st.color)}>{st.label}</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
          {[
            { label: 'Date',     value: formatBookingDate(booking.booking_date) },
            { label: 'Time',     value: `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}` },
            { label: 'Location', value: `${booking.provider?.neighborhood?.name}, ${booking.provider?.neighborhood?.corporation}` },
            { label: 'Price',    value: formatCurrency(booking.service_price) },
            { label: 'Booked On',value: formatDate(booking.created_at) },
          ].map(d => (
            <div key={d.label}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{d.label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{d.value}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium mb-1">Your Notes</p>
            <p className="text-sm text-gray-700">{booking.notes}</p>
          </div>
        )}

        {/* Cancellation info */}
        {booking.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Cancelled by {booking.cancelled_by}</p>
              {booking.cancellation_reason && <p className="text-xs text-red-600 mt-0.5">{booking.cancellation_reason}</p>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Cancel */}
          {['pending', 'confirmed'].includes(booking.status) && (
            <button onClick={() => setShowCancelForm(true)} className="btn-secondary gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <XCircle size={15} /> Cancel Booking
            </button>
          )}

          {/* Review */}
          {booking.status === 'completed' && !booking.review && (
            <button onClick={() => setShowReviewForm(true)} className="btn-primary gap-2">
              <Star size={15} /> Leave a Review
            </button>
          )}

          {/* View provider */}
          <Link href={`/providers/${booking.provider?.business_slug}`} className="btn-secondary">
            View Provider
          </Link>
        </div>

        {/* Existing review */}
        {booking.review && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Your Review</p>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={s <= booking.review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
              ))}
            </div>
            {booking.review.review_text && <p className="text-sm text-gray-700 italic">"{booking.review.review_text}"</p>}
          </div>
        )}
      </div>

      {/* Cancel form */}
      {showCancelForm && (
        <div className="card p-5 border-2 border-red-100">
          <h3 className="font-bold text-gray-900 mb-3 text-red-700">Cancel Booking</h3>
          <p className="text-sm text-gray-500 mb-3">This action cannot be undone.</p>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Reason for cancellation (optional)…" className="input resize-none mb-3" />
          <div className="flex gap-3">
            <button onClick={() => cancel()} disabled={cancelling} className="btn-danger flex-1 disabled:opacity-50">
              {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
            <button onClick={() => setShowCancelForm(false)} className="btn-secondary flex-1">Keep Booking</button>
          </div>
        </div>
      )}

      {/* Review form */}
      {showReviewForm && (
        <div className="card p-5 border-2 border-amber-100">
          <h3 className="font-bold text-gray-900 mb-4">Rate Your Experience</h3>
          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                <Star size={28} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-2">{rating}/5</span>
          </div>
          <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} placeholder="Share your experience (optional)…" className="input resize-none mb-4" />
          <div className="flex gap-3">
            <button onClick={() => submitReview()} disabled={reviewing} className="btn-primary flex-1 disabled:opacity-50">
              {reviewing ? 'Submitting…' : 'Submit Review'}
            </button>
            <button onClick={() => setShowReviewForm(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
