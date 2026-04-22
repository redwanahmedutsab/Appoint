<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProviderProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = $request->user()
            ->favoriteProviders()
            ->with(['category', 'neighborhood'])
            ->get();

        return response()->json(['favorites' => $favorites]);
    }

    public function toggle(Request $request, ProviderProfile $provider): JsonResponse
    {
        $user = $request->user();

        if ($user->favoriteProviders()->where('provider_id', $provider->id)->exists()) {
            $user->favoriteProviders()->detach($provider->id);
            $isFavorite = false;
            $message = 'Removed from favorites.';
        } else {
            $user->favoriteProviders()->attach($provider->id);
            $isFavorite = true;
            $message = 'Added to favorites.';
        }

        return response()->json(['message' => $message, 'is_favorite' => $isFavorite]);
    }
}
