<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProviderProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_slug',
        'category_id',
        'neighborhood_id',
        'address',
        'phone',
        'whatsapp',
        'description',
        'cover_image',
        'gallery_images',
        'approval_status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'average_rating',
        'total_reviews',
        'total_bookings',
        'is_active',
        'working_hours',
    ];

    protected $casts = [
        'gallery_images' => 'array',
        'working_hours' => 'array',
        'approved_at' => 'datetime',
        'is_active' => 'boolean',
        'average_rating' => 'decimal:2',
    ];

    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }

    public function neighborhood()
    {
        return $this->belongsTo(Neighborhood::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'provider_id');
    }

    public function availabilitySlots()
    {
        return $this->hasMany(AvailabilitySlot::class, 'provider_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'provider_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'provider_id');
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorite_providers', 'provider_id', 'user_id')
                    ->withTimestamps();
    }

    public function commissionRecords()
    {
        return $this->hasMany(CommissionRecord::class, 'provider_id');
    }

    // Recalculate rating after review
    public function recalculateRating(): void
    {
        $avg = $this->reviews()->where('is_visible', true)->avg('rating') ?? 0;
        $count = $this->reviews()->where('is_visible', true)->count();
        $this->update([
            'average_rating' => round($avg, 2),
            'total_reviews' => $count,
        ]);
    }
}
