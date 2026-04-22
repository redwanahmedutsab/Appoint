<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\CommissionRecord;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * List bookings for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['provider.category', 'provider.neighborhood', 'service', 'review'])
            ->where('user_id', $request->user()->id)
            ->orderBy('booking_date', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $bookings = $query->paginate(10);

        return response()->json($bookings);
    }

    /**
     * Create a new booking
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'slot_id'    => 'required|exists:availability_slots,id',
            'notes'      => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            // Lock the slot to prevent race conditions
            $slot = AvailabilitySlot::lockForUpdate()->find($validated['slot_id']);

            if (!$slot->isAvailable()) {
                return response()->json(['message' => 'This time slot is no longer available.'], 422);
            }

            $service = Service::with('provider')->findOrFail($validated['service_id']);

            // Ensure service belongs to the same provider as the slot
            if ($service->provider_id !== $slot->provider_id) {
                return response()->json(['message' => 'Service and slot provider mismatch.'], 422);
            }

            if (!$service->provider->isApproved() || !$service->provider->is_active) {
                return response()->json(['message' => 'This provider is not currently accepting bookings.'], 422);
            }

            $commissionAmount = round($service->price * (config('app.commission_rate', 5) / 100), 2);

            $booking = Booking::create([
                'user_id'           => $request->user()->id,
                'provider_id'       => $service->provider_id,
                'service_id'        => $service->id,
                'slot_id'           => $slot->id,
                'booking_date'      => $slot->date,
                'start_time'        => $slot->start_time,
                'end_time'          => $slot->end_time,
                'service_price'     => $service->price,
                'commission_amount' => $commissionAmount,
                'status'            => 'pending',
                'notes'             => $validated['notes'] ?? null,
            ]);

            // Mark slot as booked
            $slot->update(['is_booked' => true]);

            // Increment provider booking count
            $service->provider->increment('total_bookings');

            return response()->json([
                'message' => 'Booking created successfully.',
                'booking' => $booking->load(['provider.category', 'service', 'slot']),
            ], 201);
        });
    }

    /**
     * Get single booking details
     */
    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeBookingAccess($request->user(), $booking);

        return response()->json([
            'booking' => $booking->load(['user', 'provider.category', 'provider.neighborhood', 'service', 'review', 'dispute']),
        ]);
    }

    /**
     * Cancel a booking (user)
     */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$booking->canBeCancelledByUser()) {
            return response()->json(['message' => 'This booking cannot be cancelled. It may be too close to the appointment time or already completed.'], 422);
        }

        $request->validate(['reason' => 'nullable|string|max:500']);

        DB::transaction(function () use ($request, $booking) {
            $booking->update([
                'status'              => 'cancelled',
                'cancelled_by'        => 'user',
                'cancellation_reason' => $request->reason,
                'cancelled_at'        => now(),
            ]);

            // Free up the slot
            $booking->slot->update(['is_booked' => false]);
        });

        return response()->json(['message' => 'Booking cancelled successfully.']);
    }

    /**
     * Reschedule a booking
     */
    public function reschedule(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate(['slot_id' => 'required|exists:availability_slots,id']);

        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Only pending or confirmed bookings can be rescheduled.'], 422);
        }

        return DB::transaction(function () use ($request, $booking) {
            $newSlot = AvailabilitySlot::lockForUpdate()->find($request->slot_id);

            if (!$newSlot->isAvailable()) {
                return response()->json(['message' => 'The selected slot is not available.'], 422);
            }

            if ($newSlot->provider_id !== $booking->provider_id) {
                return response()->json(['message' => 'New slot must be for the same provider.'], 422);
            }

            // Free old slot
            $booking->slot->update(['is_booked' => false]);

            // Update booking with new slot
            $booking->update([
                'slot_id'      => $newSlot->id,
                'booking_date' => $newSlot->date,
                'start_time'   => $newSlot->start_time,
                'end_time'     => $newSlot->end_time,
            ]);

            // Book new slot
            $newSlot->update(['is_booked' => true]);

            return response()->json(['message' => 'Booking rescheduled successfully.', 'booking' => $booking->fresh()->load(['service', 'slot'])]);
        });
    }

    private function authorizeBookingAccess($user, Booking $booking): void
    {
        if ($user->isAdmin()) return;
        if ($user->isProvider() && $booking->provider_id === $user->providerProfile?->id) return;
        if ($booking->user_id === $user->id) return;
        abort(403, 'Unauthorized access to booking.');
    }
}
