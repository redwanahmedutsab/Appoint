'use client';
// src/app/(public)/providers/[slug]/page.tsx
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { providerApi, bookingApi } from '@/lib/api';
import { Star, MapPin, Phone, Clock, ChevronLeft } from 'lucide-react';
import { formatCurrency, formatTime, cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Service, AvailabilitySlot } from '@/types';
import { format, addDays } from 'date-fns';

export default function ProviderDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate]       = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot]       = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes]                     = useState('');
  const [step, setStep]                       = useState<'service' | 'slot' | 'confirm'>('service');

  const { data, isLoading } = useQuery({
    queryKey: ['provider', slug],
    queryFn: () => providerApi.show(slug).then(r => r.data.provider),
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', data?.id, selectedDate],
    queryFn: () => providerApi.slots(data!.id, selectedDate).then(r => r.data),
    enabled: !!data?.id && step === 'slot',
  });

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: () => bookingApi.create({ service_id: selectedService!.id, slot_id: selectedSlot!.id, notes }),
    onSuccess: (res) => {
      toast.success('Booking confirmed! 🎉');
      router.push(`/dashboard/bookings/${res.data.booking.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    },
  });

  const handleBook = () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    createBooking();
  };

  // Generate next 14 days for date picker
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { iso: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), day: format(d, 'd'), month: format(d, 'MMM') };
  });

  if (isLoading) return (
    <div className="page-container py-16 animate-pulse">
      <div className="skeleton h-64 rounded-3xl mb-8" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return <div className="page-container py-16 text-center text-gray-500">Provider not found.</div>;

  const provider = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="page-container pt-6">
        <Link href="/providers" className="btn-ghost btn-sm inline-flex">
          <ChevronLeft size={16} /> Back to Providers
        </Link>
      </div>

      {/* Hero */}
      <div className="page-container py-4">
        <div className="card overflow-hidden">
          <div className="h-56 bg-gradient-to-br from-brand-400 to-brand-700 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl opacity-20">🏪</span>
            </div>
          </div>
          <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-gray-900">{provider.business_name}</h1>
                <span className="badge bg-brand-50 text-brand-700 border-brand-100">{provider.category?.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><MapPin size={14} />{provider.neighborhood?.name}, {provider.neighborhood?.corporation}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} />{provider.phone}</span>
              </div>
              {provider.description && <p className="mt-3 text-sm text-gray-600 max-w-2xl leading-relaxed">{provider.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(provider.average_rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-100'} />
                ))}
                <span className="text-base font-bold text-gray-900 ml-1">{provider.average_rating > 0 ? provider.average_rating.toFixed(1) : 'New'}</span>
              </div>
              {provider.total_reviews > 0 && <span className="text-sm text-gray-400">{provider.total_reviews} reviews</span>}
              <span className="text-sm text-gray-400">{provider.total_bookings} bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="page-container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Services & Reviews */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Services */}
            <div className="card p-6">
              <h2 className="text-lg font-bold font-display mb-4">Services</h2>
              <div className="flex flex-col gap-3">
                {provider.services?.map((service: Service) => (
                  <div
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep('slot'); setSelectedSlot(null); }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all',
                      selectedService?.id === service.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'
                    )}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={12} />{service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-600">{formatCurrency(service.price)}</p>
                      {selectedService?.id === service.id && (
                        <span className="text-xs text-brand-600 font-medium">Selected ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {provider.reviews && provider.reviews.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-bold font-display mb-4">Customer Reviews</h2>
                <div className="flex flex-col gap-4">
                  {provider.reviews.map((review: any) => (
                    <div key={review.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                        {review.user?.name?.[0] ?? '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{review.user?.name}</span>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={11} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-100'} />
                            ))}
                          </div>
                        </div>
                        {review.review_text && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.review_text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Panel */}
          <div className="flex flex-col gap-4">
            <div className="card p-5 sticky top-24">
              <h2 className="text-lg font-bold font-display mb-4">Book Appointment</h2>

              {!selectedService ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Select a service to continue</p>
                </div>
              ) : (
                <>
                  {/* Selected service summary */}
                  <div className="bg-brand-50 rounded-xl p-3 mb-4 border border-brand-100">
                    <p className="text-sm font-semibold text-brand-900">{selectedService.name}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-brand-600">{selectedService.duration_minutes} min</span>
                      <span className="text-sm font-bold text-brand-700">{formatCurrency(selectedService.price)}</span>
                    </div>
                  </div>

                  {/* Date picker */}
                  <p className="text-sm font-semibold text-gray-700 mb-2">Choose Date</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
                    {dates.map(d => (
                      <button
                        key={d.iso}
                        onClick={() => { setSelectedDate(d.iso); setSelectedSlot(null); }}
                        className={cn(
                          'flex flex-col items-center px-3 py-2 rounded-xl border text-xs shrink-0 transition-all',
                          selectedDate === d.iso
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                        )}
                      >
                        <span className="font-medium">{d.label}</span>
                        <span className="text-base font-bold">{d.day}</span>
                        <span>{d.month}</span>
                      </button>
                    ))}
                  </div>

                  {/* Time slots */}
                  <p className="text-sm font-semibold text-gray-700 mb-2">Choose Time</p>
                  {slotsLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-9 rounded-lg" />)}
                    </div>
                  ) : slotsData?.slots?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No slots available on this date</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {slotsData?.slots?.map((slot: AvailabilitySlot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            'text-xs py-2 rounded-lg border transition-all',
                            selectedSlot?.id === slot.id
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
                          )}
                        >
                          {formatTime(slot.start_time)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {selectedSlot && (
                    <div className="mb-4">
                      <label className="label">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Any special requests or information…"
                        className="input resize-none text-xs"
                      />
                    </div>
                  )}

                  {/* Book button */}
                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || isPending}
                    className="btn-primary w-full justify-center btn-lg disabled:opacity-50"
                  >
                    {isPending ? 'Booking…' : isAuthenticated ? 'Confirm Booking' : 'Login to Book'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
