<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CommissionRecord;
use App\Models\Dispute;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // ─── Dashboard ──────────────────────────────────────────────────────────

    public function dashboard(): JsonResponse
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        $stats = [
            'total_users'             => User::where('role', 'user')->count(),
            'total_providers'         => ProviderProfile::count(),
            'approved_providers'      => ProviderProfile::where('approval_status', 'approved')->count(),
            'pending_providers'       => ProviderProfile::where('approval_status', 'pending')->count(),
            'total_bookings'          => Booking::count(),
            'today_bookings'          => Booking::whereDate('booking_date', $today)->count(),
            'monthly_bookings'        => Booking::where('booking_date', '>=', $thisMonth)->count(),
            'completed_bookings'      => Booking::where('status', 'completed')->count(),
            'monthly_revenue'         => Booking::where('status', 'completed')->where('booking_date', '>=', $thisMonth)->sum('service_price'),
            'monthly_commission'      => CommissionRecord::where('created_at', '>=', $thisMonth)->sum('commission_amount'),
            'pending_commission'      => CommissionRecord::where('settlement_status', 'pending')->sum('commission_amount'),
            'open_disputes'           => Dispute::where('status', 'open')->count(),
        ];

        $recentBookings = Booking::with(['user:id,name', 'provider:id,business_name', 'service:id,name'])
            ->latest()
            ->limit(5)
            ->get();

        $pendingProviders = ProviderProfile::with(['user:id,name,email', 'category:id,name'])
            ->where('approval_status', 'pending')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'stats'             => $stats,
            'recent_bookings'   => $recentBookings,
            'pending_providers' => $pendingProviders,
        ]);
    }

    // ─── Provider Management ─────────────────────────────────────────────────

    public function providers(Request $request): JsonResponse
    {
        $query = ProviderProfile::with(['user:id,name,email,phone', 'category:id,name', 'neighborhood:id,name']);

        if ($request->has('status')) {
            $query->where('approval_status', $request->status);
        }
        if ($request->has('search')) {
            $query->where('business_name', 'ilike', "%{$request->search}%");
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function approveProvider(Request $request, ProviderProfile $provider): JsonResponse
    {
        $request->validate(['action' => 'required|in:approve,reject', 'reason' => 'required_if:action,reject|nullable|string']);

        if ($request->action === 'approve') {
            $provider->update([
                'approval_status' => 'approved',
                'approved_at'     => now(),
                'approved_by'     => $request->user()->id,
                'rejection_reason'=> null,
            ]);
            $message = 'Provider approved.';
        } else {
            $provider->update([
                'approval_status' => 'rejected',
                'rejection_reason'=> $request->reason,
            ]);
            $message = 'Provider rejected.';
        }

        return response()->json(['message' => $message, 'provider' => $provider->fresh()]);
    }

    public function suspendProvider(Request $request, ProviderProfile $provider): JsonResponse
    {
        $provider->update(['approval_status' => 'suspended', 'is_active' => false]);
        return response()->json(['message' => 'Provider suspended.']);
    }

    // ─── User Management ─────────────────────────────────────────────────────

    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function toggleUserStatus(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot modify admin accounts.'], 403);
        }

        $newStatus = $user->status === 'active' ? 'suspended' : 'active';
        $user->update(['status' => $newStatus]);

        return response()->json(['message' => "User {$newStatus}.", 'user' => $user->fresh()]);
    }

    // ─── Booking Management ──────────────────────────────────────────────────

    public function bookings(Request $request): JsonResponse
    {
        $query = Booking::with(['user:id,name,email', 'provider:id,business_name', 'service:id,name']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('date')) {
            $query->whereDate('booking_date', $request->date);
        }
        if ($request->has('provider_id')) {
            $query->where('provider_id', $request->provider_id);
        }

        return response()->json($query->latest()->paginate(20));
    }

    // ─── Commission Management ───────────────────────────────────────────────

    public function commissions(Request $request): JsonResponse
    {
        $query = CommissionRecord::with(['provider:id,business_name', 'booking:id,booking_reference,booking_date']);

        if ($request->has('status')) {
            $query->where('settlement_status', $request->status);
        }
        if ($request->has('provider_id')) {
            $query->where('provider_id', $request->provider_id);
        }
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $summary = [
            'total_pending'  => CommissionRecord::where('settlement_status', 'pending')->sum('commission_amount'),
            'total_settled'  => CommissionRecord::where('settlement_status', 'settled')->sum('commission_amount'),
            'total_all_time' => CommissionRecord::sum('commission_amount'),
        ];

        return response()->json(['summary' => $summary, 'records' => $query->latest()->paginate(20)]);
    }

    public function settleCommissions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider_id' => 'required|exists:provider_profiles,id',
            'week_start'  => 'required|date',
            'week_end'    => 'required|date|after_or_equal:week_start',
        ]);

        $count = CommissionRecord::where('provider_id', $validated['provider_id'])
            ->where('settlement_status', 'pending')
            ->whereBetween(DB::raw('DATE(created_at)'), [$validated['week_start'], $validated['week_end']])
            ->update([
                'settlement_status' => 'settled',
                'week_start'        => $validated['week_start'],
                'week_end'          => $validated['week_end'],
                'settled_at'        => now(),
                'settled_by'        => $request->user()->id,
            ]);

        return response()->json(['message' => "{$count} commission records settled."]);
    }

    public function exportCommissions(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $from = $request->get('from', Carbon::now()->startOfWeek()->toDateString());
        $to   = $request->get('to', Carbon::now()->endOfWeek()->toDateString());

        $records = CommissionRecord::with(['provider:id,business_name', 'booking:id,booking_reference,booking_date'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=commissions_{$from}_{$to}.csv",
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Booking Ref', 'Provider', 'Booking Date', 'Service Amount', 'Commission Rate', 'Commission Amount', 'Status', 'Settled At']);

            foreach ($records as $r) {
                fputcsv($handle, [
                    $r->booking->booking_reference,
                    $r->provider->business_name,
                    $r->booking->booking_date,
                    $r->service_amount,
                    $r->commission_rate . '%',
                    $r->commission_amount,
                    $r->settlement_status,
                    $r->settled_at,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    // ─── Category Management ─────────────────────────────────────────────────

    public function categories(): JsonResponse
    {
        return response()->json(['categories' => ServiceCategory::orderBy('sort_order')->get()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'slug'        => 'required|string|unique:service_categories,slug',
            'icon'        => 'nullable|string',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
        ]);

        $category = ServiceCategory::create($validated);
        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, ServiceCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'icon'        => 'nullable|string',
            'description' => 'nullable|string',
            'is_active'   => 'sometimes|boolean',
            'sort_order'  => 'nullable|integer',
        ]);

        $category->update($validated);
        return response()->json(['category' => $category->fresh()]);
    }

    // ─── Disputes ────────────────────────────────────────────────────────────

    public function disputes(Request $request): JsonResponse
    {
        $query = Dispute::with(['booking.user:id,name', 'booking.provider:id,business_name', 'raisedBy:id,name']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function resolveDispute(Request $request, Dispute $dispute): JsonResponse
    {
        $validated = $request->validate([
            'resolution' => 'required|string|max:1000',
            'status'     => 'required|in:resolved,closed',
        ]);

        $dispute->update([
            'status'      => $validated['status'],
            'resolution'  => $validated['resolution'],
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        return response()->json(['message' => 'Dispute resolved.', 'dispute' => $dispute->fresh()]);
    }
}
