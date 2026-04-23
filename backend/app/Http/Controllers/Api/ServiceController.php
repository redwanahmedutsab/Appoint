<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * List all services for a provider (public)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('provider:id,business_name,business_slug,average_rating')
            ->where('is_active', true);

        if ($request->has('provider_id')) {
            $query->where('provider_id', $request->provider_id);
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        return response()->json($query->orderBy('sort_order')->paginate(20));
    }

    /**
     * Get provider's own services
     */
    public function myServices(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();
        $services = Service::where('provider_id', $provider->id)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['services' => $services]);
    }

    /**
     * Create a service
     */
    public function store(Request $request): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        if (!$provider->isApproved()) {
            return response()->json(['message' => 'Your provider profile must be approved before adding services.'], 403);
        }

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string|max:1000',
            'price'            => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'sort_order'       => 'nullable|integer|min:0',
        ]);

        $service = Service::create([
            ...$validated,
            'provider_id' => $provider->id,
            'is_active'   => true,
        ]);

        return response()->json(['message' => 'Service created.', 'service' => $service], 201);
    }

    /**
     * Update a service
     */
    public function update(Request $request, Service $service): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        if ($service->provider_id !== $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'description'      => 'nullable|string|max:1000',
            'price'            => 'sometimes|numeric|min:0',
            'duration_minutes' => 'sometimes|integer|min:15|max:480',
            'is_active'        => 'sometimes|boolean',
            'sort_order'       => 'nullable|integer|min:0',
        ]);

        $service->update($validated);

        return response()->json(['message' => 'Service updated.', 'service' => $service->fresh()]);
    }

    /**
     * Delete a service
     */
    public function destroy(Request $request, Service $service): JsonResponse
    {
        $provider = $request->user()->providerProfile()->firstOrFail();

        if ($service->provider_id !== $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Soft delete - keep for booking records
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }
}
