'use client';
// src/components/bookings/BookingCard.tsx
import Link from 'next/link';
import { Booking } from '@/types';
import { bookingStatusConfig, formatBookingDate, formatTime, formatCurrency, cn } from '@/lib/utils';
import { MapPin, Clock, Calendar } from 'lucide-react';

interface Props { booking: Booking; showActions?: boolean; }

export function BookingCard({ booking }: Props) {
  const status = bookingStatusConfig[booking.status];

  return (
    <Link href={`/dashboard/bookings/${booking.id}`} className="card-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4 block">
      {/* Left: color indicator */}
      <div className={`w-1.5 self-stretch rounded-full shrink-0 hidden sm:block ${
        booking.status === 'completed' ? 'bg-green-400' :
        booking.status === 'confirmed' ? 'bg-blue-400' :
        booking.status === 'pending'   ? 'bg-amber-400' :
        booking.status === 'cancelled' ? 'bg-red-300' : 'bg-gray-200'
      }`} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{booking.service?.name ?? 'Service'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{booking.provider?.business_name}</p>
          </div>
          <span className={cn('badge border text-xs', status.bg, status.color)}>{status.label}</span>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={12} className="text-gray-400" />
            {formatBookingDate(booking.booking_date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
          </span>
          {booking.provider?.neighborhood && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-gray-400" />
              {booking.provider.neighborhood.name}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900">{formatCurrency(booking.service_price)}</p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{booking.booking_reference}</p>
      </div>
    </Link>
  );
}
