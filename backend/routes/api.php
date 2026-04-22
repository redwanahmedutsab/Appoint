<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Appointly
|--------------------------------------------------------------------------
*/

// ─── Public Routes ──────────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    // Auth
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    // Service Discovery
    Route::get('/providers',                        [ProviderController::class, 'index']);
    Route::get('/providers/{slug}',                 [ProviderController::class, 'show']);
    Route::get('/providers/{provider}/slots',       [AvailabilityController::class, 'publicSlots']);
    Route::get('/services',                         [ServiceController::class, 'index']);
    Route::get('/providers/{providerId}/reviews',   [ReviewController::class, 'providerReviews']);

    // Lookup data
    Route::get('/categories',    fn() => response()->json(['categories' => \App\Models\ServiceCategory::where('is_active', true)->orderBy('sort_order')->get()]));
    Route::get('/neighborhoods', fn() => response()->json(['neighborhoods' => \App\Models\Neighborhood::where('is_active', true)->orderBy('name')->get()]));

    // ─── Authenticated Routes ────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/logout',           [AuthController::class, 'logout']);
        Route::get('/me',                [AuthController::class, 'me']);
        Route::patch('/me',              [AuthController::class, 'updateProfile']);
        Route::post('/change-password',  [AuthController::class, 'changePassword']);

        // ─── User Routes ─────────────────────────────────────────────────────
        Route::middleware('role:user,provider,admin')->group(function () {

            // Bookings (user side)
            Route::get('/bookings',                    [BookingController::class, 'index']);
            Route::post('/bookings',                   [BookingController::class, 'store']);
            Route::get('/bookings/{booking}',          [BookingController::class, 'show']);
            Route::post('/bookings/{booking}/cancel',  [BookingController::class, 'cancel']);
            Route::post('/bookings/{booking}/reschedule', [BookingController::class, 'reschedule']);

            // Reviews
            Route::post('/bookings/{booking}/review',  [ReviewController::class, 'store']);

            // Favorites
            Route::get('/favorites',                         [FavoriteController::class, 'index']);
            Route::post('/favorites/{provider}/toggle',      [FavoriteController::class, 'toggle']);
        });

        // ─── Provider Routes ─────────────────────────────────────────────────
        Route::prefix('provider')->middleware('role:provider,admin')->group(function () {
            // Profile
            Route::get('/profile',    [ProviderController::class, 'myProfile']);
            Route::post('/profile',   [ProviderController::class, 'createProfile']);
            Route::patch('/profile',  [ProviderController::class, 'updateProfile']);
            Route::get('/dashboard',  [ProviderController::class, 'dashboard']);

            // Bookings
            Route::get('/bookings',                          [ProviderController::class, 'providerBookings']);
            Route::patch('/bookings/{booking}/status',       [ProviderController::class, 'updateBookingStatus']);

            // Services
            Route::get('/services',         [ServiceController::class, 'myServices']);
            Route::post('/services',        [ServiceController::class, 'store']);
            Route::patch('/services/{service}', [ServiceController::class, 'update']);
            Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

            // Availability
            Route::get('/slots',                            [AvailabilityController::class, 'index']);
            Route::post('/slots/generate',                  [AvailabilityController::class, 'generate']);
            Route::patch('/slots/{slot}/toggle-block',      [AvailabilityController::class, 'toggleBlock']);
            Route::delete('/slots',                         [AvailabilityController::class, 'deleteRange']);
        });

        // Allow any user to register as provider
        Route::post('/become-provider', [ProviderController::class, 'createProfile']);

        // ─── Admin Routes ─────────────────────────────────────────────────────
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/dashboard',  [AdminController::class, 'dashboard']);

            // Providers
            Route::get('/providers',                               [AdminController::class, 'providers']);
            Route::post('/providers/{provider}/approve',           [AdminController::class, 'approveProvider']);
            Route::post('/providers/{provider}/suspend',           [AdminController::class, 'suspendProvider']);

            // Users
            Route::get('/users',                                   [AdminController::class, 'users']);
            Route::patch('/users/{user}/toggle-status',            [AdminController::class, 'toggleUserStatus']);

            // Bookings
            Route::get('/bookings',                                [AdminController::class, 'bookings']);

            // Commissions
            Route::get('/commissions',                             [AdminController::class, 'commissions']);
            Route::post('/commissions/settle',                     [AdminController::class, 'settleCommissions']);
            Route::get('/commissions/export',                      [AdminController::class, 'exportCommissions']);

            // Categories
            Route::get('/categories',                              [AdminController::class, 'categories']);
            Route::post('/categories',                             [AdminController::class, 'storeCategory']);
            Route::patch('/categories/{category}',                 [AdminController::class, 'updateCategory']);

            // Disputes
            Route::get('/disputes',                                [AdminController::class, 'disputes']);
            Route::patch('/disputes/{dispute}/resolve',            [AdminController::class, 'resolveDispute']);
        });
    });
});
