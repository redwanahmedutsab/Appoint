// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach token ──────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('appointly_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle auth errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('appointly_token');
        localStorage.removeItem('appointly_user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (data: unknown) => api.post('/register', data),
  login:          (data: unknown) => api.post('/login', data),
  logout:         () => api.post('/logout'),
  me:             () => api.get('/me'),
  updateProfile:  (data: unknown) => api.patch('/me', data),
  changePassword: (data: unknown) => api.post('/change-password', data),
};

// ── Providers ─────────────────────────────────────────────────────────────
export const providerApi = {
  list:   (params?: Record<string, unknown>) => api.get('/providers', { params }),
  show:   (slug: string) => api.get(`/providers/${slug}`),
  slots:  (providerId: number, date: string) =>
    api.get(`/providers/${providerId}/slots`, { params: { date } }),
  reviews: (providerId: number, page?: number) =>
    api.get(`/providers/${providerId}/reviews`, { params: { page } }),

  // Provider dashboard
  myProfile:     () => api.get('/provider/profile'),
  createProfile: (data: unknown) => api.post('/provider/profile', data),
  updateProfile: (data: unknown) => api.patch('/provider/profile', data),
  dashboard:     () => api.get('/provider/dashboard'),
  myBookings:    (params?: Record<string, unknown>) => api.get('/provider/bookings', { params }),
  updateBookingStatus: (bookingId: number, data: { status: string; reason?: string }) =>
    api.patch(`/provider/bookings/${bookingId}/status`, data),

  // Become provider (users)
  becomeProvider: (data: unknown) => api.post('/become-provider', data),
};

// ── Services ──────────────────────────────────────────────────────────────
export const serviceApi = {
  list:       (params?: Record<string, unknown>) => api.get('/services', { params }),
  myServices: () => api.get('/provider/services'),
  create:     (data: unknown) => api.post('/provider/services', data),
  update:     (id: number, data: unknown) => api.patch(`/provider/services/${id}`, data),
  delete:     (id: number) => api.delete(`/provider/services/${id}`),
};

// ── Availability ──────────────────────────────────────────────────────────
export const availabilityApi = {
  mySlots:     (params: { from: string; to?: string }) => api.get('/provider/slots', { params }),
  generate:    (data: unknown) => api.post('/provider/slots/generate', data),
  toggleBlock: (slotId: number) => api.patch(`/provider/slots/${slotId}/toggle-block`),
  deleteRange: (data: { from: string; to: string }) => api.delete('/provider/slots', { data }),
};

// ── Bookings ──────────────────────────────────────────────────────────────
export const bookingApi = {
  list:       (params?: Record<string, unknown>) => api.get('/bookings', { params }),
  create:     (data: { service_id: number; slot_id: number; notes?: string }) => api.post('/bookings', data),
  show:       (id: number) => api.get(`/bookings/${id}`),
  cancel:     (id: number, reason?: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  reschedule: (id: number, slotId: number) => api.post(`/bookings/${id}/reschedule`, { slot_id: slotId }),
  review:     (bookingId: number, data: { rating: number; review_text?: string }) =>
    api.post(`/bookings/${bookingId}/review`, data),
};

// ── Favorites ─────────────────────────────────────────────────────────────
export const favoriteApi = {
  list:   () => api.get('/favorites'),
  toggle: (providerId: number) => api.post(`/favorites/${providerId}/toggle`),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),

  providers:       (params?: Record<string, unknown>) => api.get('/admin/providers', { params }),
  approveProvider: (id: number, data: { action: 'approve' | 'reject'; reason?: string }) =>
    api.post(`/admin/providers/${id}/approve`, data),
  suspendProvider: (id: number) => api.post(`/admin/providers/${id}/suspend`),

  users:            (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  toggleUserStatus: (id: number) => api.patch(`/admin/users/${id}/toggle-status`),

  bookings: (params?: Record<string, unknown>) => api.get('/admin/bookings', { params }),

  commissions:       (params?: Record<string, unknown>) => api.get('/admin/commissions', { params }),
  settleCommissions: (data: unknown) => api.post('/admin/commissions/settle', data),
  exportCommissions: (params?: { from?: string; to?: string }) =>
    api.get('/admin/commissions/export', { params, responseType: 'blob' }),

  categories:     () => api.get('/admin/categories'),
  createCategory: (data: unknown) => api.post('/admin/categories', data),
  updateCategory: (id: number, data: unknown) => api.patch(`/admin/categories/${id}`, data),

  disputes:       (params?: Record<string, unknown>) => api.get('/admin/disputes', { params }),
  resolveDispute: (id: number, data: unknown) => api.patch(`/admin/disputes/${id}/resolve`, data),
};

// ── Lookup data ───────────────────────────────────────────────────────────
export const lookupApi = {
  categories:    () => api.get('/categories'),
  neighborhoods: () => api.get('/neighborhoods'),
};
