<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get reviews for a provider (public)
     */
    public function providerReviews($providerId): JsonResponse
    {
        $reviews = Review::with('user:id,name,avatar')
            ->where('provider_id', $providerId)
            ->where('is_visible', true)
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }

    /**
     * Submit a review after a completed booking
     */
    public function store(Request $request, Booking $booking): JsonResponse
    {
        // Only the booking owner can review
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status !== 'completed') {
            return response()->json(['message' => 'You can only review completed bookings.'], 422);
        }

        if ($booking->review) {
            return response()->json(['message' => 'You have already reviewed this booking.'], 422);
        }

        $validated = $request->validate([
            'rating'      => 'required|integer|between:1,5',
            'review_text' => 'nullable|string|max:1000',
        ]);

        $review = Review::create([
            'booking_id'  => $booking->id,
            'user_id'     => $request->user()->id,
            'provider_id' => $booking->provider_id,
            'rating'      => $validated['rating'],
            'review_text' => $validated['review_text'] ?? null,
            'is_visible'  => true,
        ]);

        // Recalculate provider rating
        $booking->provider->recalculateRating();

        return response()->json(['message' => 'Review submitted.', 'review' => $review], 201);
    }
}
