// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { BookingStatus, ApprovalStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount as number) || !isFinite(amount as number)) return '৳0';
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  try {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m));
    return format(date, 'h:mm a');
  } catch {
    return timeStr;
  }
}

export function formatBookingDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function isDatePast(dateStr: string): boolean {
  try {
    return isPast(parseISO(dateStr));
  } catch {
    return false;
  }
}

export const bookingStatusConfig: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  no_show:   { label: 'No Show',   color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
};

export const approvalStatusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending Review', color: 'text-amber-700',  bg: 'bg-amber-50' },
  approved:  { label: 'Approved',       color: 'text-green-700',  bg: 'bg-green-50' },
  rejected:  { label: 'Rejected',       color: 'text-red-700',    bg: 'bg-red-50' },
  suspended: { label: 'Suspended',      color: 'text-gray-700',   bg: 'bg-gray-50' },
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.slice(0, length) + '…' : text;
}

export function getApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Something went wrong.';
  }
  return 'Something went wrong.';
}

export const CATEGORY_ICONS: Record<string, string> = {
  'salons-parlours':      '✂️',
  'clinics-diagnostics':  '🏥',
  'laundry-dry-cleaning': '👕',
  'consultancy-services': '💼',
  'tuition-coaching':     '📚',
};