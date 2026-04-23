<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\ProviderProfile;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProviderController extends Controller
{
    /**
     * Public: List approved providers with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProviderProfile::with(['category', 'neighborhood', 'user'])
            ->where('approval_status', 'approved')
            ->where('is_active', true);

        if ($request->has('category')) {
            $query->where('category_id', $request->category);
        }

        if ($request->has('neighborhood')) {
            $query->where('neighborhood_id', $request->neighborhood);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($request->has('min_rating')) {
            $query->where('average_rating', '>=', $request->min_rating);
        }

        if ($request->has('sort')) {
            match ($request->sort) {
                'rating'   => $query->orderBy('average_rating', 'desc'),
                'bookings' => $query->orderBy('total_bookings', 'desc'),
                default    => $query->orderBy('created_at', 'desc'),
            };
        } else {
            $query->orderBy('average_rating', 'desc');
        }

        return response()->json($query->paginate(12));
    }

    /**
     * Public: Single provider details
     */
    public function show(string $slug): JsonResponse
    {
        $provider = ProviderProfile::with([
            'category', 'neighborhood', 'user',
            'services' => fn($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'reviews'  => fn($q) => $q->where('is_visible', true)->with('user:id,name,avatar')->latest()->limit(10),
        ])
        ->where('business_slug', $slug)
        ->where('approval_status', 'approved')
        ->where('is_active', true)
        ->firstOrFail();

        return response()->json(['provider' => $provider]);
    }

    /**
     * Public: Get available slots for a provider on a date
     */
    public function availableSlots(Request $request, ProviderProfile $provider): JsonResponse
    {
        $request->validate(['date' => 'required|date|after_or_equal:today']);

        $slots = AvailabilitySlot::where('provider_id', $provider->id)
            ->where('date', $request->date)
            ->where('is_booked', false)
            ->where('is_blocked', false)
            ->orderBy('start_time')
            ->get(['id', 'date', 'start_time', 'end_time']);

        return response()->json(['slots' => $slots]);
    }

    // ─── Provider Dashboard ───────────────────────────────────────────────────

    /**
     * Provider: Get own profile
     */
    public function myProfile(Request $request): JsonResponse
    {
        $profile = $request->user()->providerProfile()->with(['category', 'neighborhood'])->firstOrFail();
        return response()->json(['provider' => $profile]);
    }

    /**
     * Provider: Create profile (first time)
     */
    public function createProfile(Request $request): JsonResponse
    {
        if ($request->user()->providerProfile) {
            return response()->json(['message' => 'Provider profile already exists.'], 422);
        }

        $validated = $request->validate([
            'business_name'   => 'required|string|max:255',
            'category_id'     => 'required|exists:service_categories,id',
            'neighborhood_id' => 'required|exists:neighborhoods,id',
            'address'         => 'required|string|max:500',
            'phone'           => 'required|string|max:20',
            'whatsapp'        => 'nullable|string|max:20',
            'description'     => 'nullable|string|max:2000',
            'working_hours'   => 'nullable|array',
        ]);

        $slug = Str::slug($validated['business_name']) . '-' . Str::random(6);

        $profile = ProviderProfile::create([
            ...$validated,
            'user_id'        => $request->user()->id,
            'business_slug'  => $slug,
            'approval_status'=> 'pending',
        ]);

        // Update user role to provider
        $request->user()->update(['role' => 'provider']);

        return response()->json([
            'message'  => 'Profile submitted for approval.',
            'provider' => $profile,
        ], 201);
    }

    /**
     * Provider: Update profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        $validated = $request->validate([
            'business_name'   => 'sometimes|string|max:255',
            'neighborhood_id' => 'sometimes|exists:neighborhoods,id',
            'address'         => 'sometimes|string|max:500',
            'phone'           => 'sometimes|string|max:20',
            'whatsapp'        => 'nullable|string|max:20',
            'description'     => 'nullable|string|max:2000',
            'working_hours'   => 'nullable|array',
        ]);

        $provider->update($validated);

        return response()->json(['message' => 'Profile updated.', 'provider' => $provider->fresh()]);
    }

    /**
     * Provider: Dashboard stats
     */
    public function dashboard(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        $today = Carbon::today();
        $thisWeekStart = Carbon::now()->startOfWeek();

        $stats = [
            'total_bookings'       => $provider->total_bookings,
            'total_reviews'        => $provider->total_reviews,
            'average_rating'       => $provider->average_rating,
            'today_bookings'       => Booking::where('provider_id', $provider->id)->whereDate('booking_date', $today)->count(),
            'upcoming_bookings'    => Booking::where('provider_id', $provider->id)->where('booking_date', '>=', $today)->whereIn('status', ['pending', 'confirmed'])->count(),
            'pending_bookings'     => Booking::where('provider_id', $provider->id)->where('status', 'pending')->count(),
            'weekly_revenue'       => Booking::where('provider_id', $provider->id)->where('status', 'completed')->where('booking_date', '>=', $thisWeekStart)->sum('service_price'),
            'pending_commission'   => \App\Models\CommissionRecord::where('provider_id', $provider->id)->where('settlement_status', 'pending')->sum('commission_amount'),
        ];

        $upcomingBookings = Booking::with(['user:id,name,phone', 'service:id,name'])
            ->where('provider_id', $provider->id)
            ->where('booking_date', '>=', $today)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        return response()->json(['stats' => $stats, 'upcoming_bookings' => $upcomingBookings]);
    }

    /**
     * Provider: Manage own bookings
     */
    public function providerBookings(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        $query = Booking::with(['user:id,name,phone,avatar', 'service:id,name,price'])
            ->where('provider_id', $provider->id)
            ->orderBy('booking_date', 'desc')
            ->orderBy('start_time', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('date')) {
            $query->whereDate('booking_date', $request->date);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Provider: Update booking status
     */
    public function updateBookingStatus(Request $request, Booking $booking): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        if ($booking->provider_id !== $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:confirmed,completed,cancelled,no_show',
            'reason' => 'required_if:status,cancelled|nullable|string|max:500',
        ]);

        $booking->update([
            'status'              => $validated['status'],
            'cancelled_by'        => $validated['status'] === 'cancelled' ? 'provider' : null,
            'cancellation_reason' => $validated['reason'] ?? null,
            'cancelled_at'        => $validated['status'] === 'cancelled' ? now() : null,
        ]);

        // Create commission record when completed
        if ($validated['status'] === 'completed') {
            \App\Models\CommissionRecord::create([
                'booking_id'       => $booking->id,
                'provider_id'      => $provider->id,
                'service_amount'   => $booking->service_price,
                'commission_rate'  => config('app.commission_rate', 5),
                'commission_amount'=> $booking->commission_amount,
            ]);
        }

        // Free slot if cancelled
        if ($validated['status'] === 'cancelled') {
            $booking->slot->update(['is_booked' => false]);
        }

        return response()->json(['message' => 'Booking status updated.', 'booking' => $booking->fresh()]);
    }
}
