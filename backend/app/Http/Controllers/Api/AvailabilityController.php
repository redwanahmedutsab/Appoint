<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AvailabilitySlot;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AvailabilityController extends Controller
{
    /**
     * Get slots for a provider (public - for booking page)
     */
    public function publicSlots(Request $request, $providerId): JsonResponse
    {
        $request->validate(['date' => 'required|date|after_or_equal:today']);

        $slots = AvailabilitySlot::where('provider_id', $providerId)
            ->where('date', $request->date)
            ->where('is_booked', false)
            ->where('is_blocked', false)
            ->orderBy('start_time')
            ->get(['id', 'start_time', 'end_time']);

        return response()->json(['slots' => $slots, 'date' => $request->date]);
    }

    /**
     * Provider: view own slots
     */
    public function index(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        $request->validate([
            'from' => 'required|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        $from = $request->from;
        $to   = $request->to ?? Carbon::parse($from)->addDays(6)->toDateString();

        $slots = AvailabilitySlot::where('provider_id', $provider->id)
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return response()->json(['slots' => $slots]);
    }

    /**
     * Provider: Bulk generate slots for a date range
     */
    public function generate(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        $validated = $request->validate([
            'from'             => 'required|date|after_or_equal:today',
            'to'               => 'required|date|after_or_equal:from',
            'slot_duration'    => 'required|integer|in:15,30,45,60,90,120',
            'work_start'       => 'required|date_format:H:i',
            'work_end'         => 'required|date_format:H:i|after:work_start',
            'days_of_week'     => 'required|array|min:1',
            'days_of_week.*'   => 'integer|between:0,6', // 0=Sunday,6=Saturday
            'break_start'      => 'nullable|date_format:H:i',
            'break_end'        => 'nullable|date_format:H:i|after:break_start',
        ]);

        $from     = Carbon::parse($validated['from']);
        $to       = Carbon::parse($validated['to']);
        $duration = $validated['slot_duration'];
        $days     = $validated['days_of_week'];

        if ($from->diffInDays($to) > 60) {
            return response()->json(['message' => 'Cannot generate slots for more than 60 days at once.'], 422);
        }

        $slotsCreated = 0;
        $current      = $from->copy();

        DB::transaction(function () use ($current, $to, $days, $duration, $validated, $provider, &$slotsCreated) {
            while ($current->lte($to)) {
                if (in_array($current->dayOfWeek, $days)) {
                    $start = Carbon::parse($current->format('Y-m-d') . ' ' . $validated['work_start']);
                    $end   = Carbon::parse($current->format('Y-m-d') . ' ' . $validated['work_end']);

                    $breakStart = isset($validated['break_start'])
                        ? Carbon::parse($current->format('Y-m-d') . ' ' . $validated['break_start'])
                        : null;
                    $breakEnd = isset($validated['break_end'])
                        ? Carbon::parse($current->format('Y-m-d') . ' ' . $validated['break_end'])
                        : null;

                    $slotStart = $start->copy();
                    while ($slotStart->copy()->addMinutes($duration)->lte($end)) {
                        $slotEnd = $slotStart->copy()->addMinutes($duration);

                        // Skip break time
                        $isDuringBreak = $breakStart && $breakEnd &&
                            $slotStart->lt($breakEnd) && $slotEnd->gt($breakStart);

                        if (!$isDuringBreak) {
                            AvailabilitySlot::firstOrCreate([
                                'provider_id' => $provider->id,
                                'date'        => $current->format('Y-m-d'),
                                'start_time'  => $slotStart->format('H:i:s'),
                            ], [
                                'end_time'   => $slotEnd->format('H:i:s'),
                                'is_booked'  => false,
                                'is_blocked' => false,
                            ]);
                            $slotsCreated++;
                        }

                        $slotStart->addMinutes($duration);
                    }
                }
                $current->addDay();
            }
        });

        return response()->json(['message' => "Generated {$slotsCreated} slots.", 'count' => $slotsCreated]);
    }

    /**
     * Provider: Block/unblock a slot
     */
    public function toggleBlock(Request $request, AvailabilitySlot $slot): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        if ($slot->provider_id !== $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($slot->is_booked) {
            return response()->json(['message' => 'Cannot block a booked slot.'], 422);
        }

        $slot->update(['is_blocked' => !$slot->is_blocked]);

        return response()->json(['message' => 'Slot updated.', 'slot' => $slot->fresh()]);
    }

    /**
     * Provider: Delete future unbooked slots
     */
    public function deleteRange(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        $validated = $request->validate([
            'from' => 'required|date|after_or_equal:today',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $deleted = AvailabilitySlot::where('provider_id', $provider->id)
            ->whereBetween('date', [$validated['from'], $validated['to']])
            ->where('is_booked', false)
            ->delete();

        return response()->json(['message' => "Deleted {$deleted} slots."]);
    }
}
