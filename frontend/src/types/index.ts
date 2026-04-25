// src/types/index.ts

export type UserRole = 'user' | 'provider' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type SettlementStatus = 'pending' | 'settled';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type Corporation = 'DNCC' | 'DSCC';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  provider_profile?: ProviderProfile;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  corporation: Corporation;
  zone?: string;
  is_active: boolean;
}

export interface ProviderProfile {
  id: number;
  user_id: number;
  business_name: string;
  business_slug: string;
  category_id: number;
  neighborhood_id: number;
  address: string;
  phone: string;
  whatsapp?: string;
  description?: string;
  cover_image?: string;
  gallery_images?: string[];
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  approved_at?: string;
  average_rating: number;
  total_reviews: number;
  total_bookings: number;
  is_active: boolean;
  working_hours?: WorkingHours;
  created_at: string;
  // Relations
  user?: User;
  category?: ServiceCategory;
  neighborhood?: Neighborhood;
  services?: Service[];
  reviews?: Review[];
}

export interface WorkingHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

export interface Service {
  id: number;
  provider_id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  image?: string;
  sort_order: number;
  provider?: ProviderProfile;
}

export interface AvailabilitySlot {
  id: number;
  provider_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  is_blocked: boolean;
}

export interface Booking {
  id: number;
  booking_reference: string;
  user_id: number;
  provider_id: number;
  service_id: number;
  slot_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  service_price: number;
  commission_amount: number;
  status: BookingStatus;
  cancelled_by?: 'user' | 'provider' | 'admin';
  cancellation_reason?: string;
  cancelled_at?: string;
  notes?: string;
  created_at: string;
  // Relations
  user?: User;
  provider?: ProviderProfile;
  service?: Service;
  slot?: AvailabilitySlot;
  review?: Review;
}

export interface Review {
  id: number;
  booking_id: number;
  user_id: number;
  provider_id: number;
  rating: number;
  review_text?: string;
  is_visible: boolean;
  created_at: string;
  user?: User;
}

export interface CommissionRecord {
  id: number;
  booking_id: number;
  provider_id: number;
  service_amount: number;
  commission_rate: number;
  commission_amount: number;
  settlement_status: SettlementStatus;
  week_start?: string;
  week_end?: string;
  settled_at?: string;
  created_at: string;
  provider?: ProviderProfile;
  booking?: Booking;
}

export interface Dispute {
  id: number;
  booking_id: number;
  raised_by: number;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
  booking?: Booking;
  raisedBy?: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface DashboardStats {
  total_users: number;
  total_providers: number;
  approved_providers: number;
  pending_providers: number;
  total_bookings: number;
  today_bookings: number;
  monthly_bookings: number;
  completed_bookings: number;
  monthly_revenue: number;
  monthly_commission: number;
  pending_commission: number;
  open_disputes: number;
}

export interface ProviderDashboardStats {
  total_bookings: number;
  total_reviews: number;
  average_rating: number;
  today_bookings: number;
  upcoming_bookings: number;
  pending_bookings: number;
  weekly_revenue: number;
  pending_commission: number;
}
