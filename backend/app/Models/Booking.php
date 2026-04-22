<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_reference',
        'user_id',
        'provider_id',
        'service_id',
        'slot_id',
        'booking_date',
        'start_time',
        'end_time',
        'service_price',
        'commission_amount',
        'status',
        'cancelled_by',
        'cancellation_reason',
        'cancelled_at',
        'notes',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'cancelled_at' => 'datetime',
        'service_price' => 'decimal:2',
        'commission_amount' => 'decimal:2',
    ];

    // Auto-generate booking reference
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($booking) {
            $booking->booking_reference = self::generateReference();
        });
    }

    public static function generateReference(): string
    {
        do {
            $ref = 'APT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        } while (self::where('booking_reference', $ref)->exists());

        return $ref;
    }

    public function canBeCancelledByUser(): bool
    {
        // Can cancel if booking is pending/confirmed and at least 2 hours before
        if (!in_array($this->status, ['pending', 'confirmed'])) {
            return false;
        }

        $bookingDateTime = \Carbon\Carbon::parse($this->booking_date->format('Y-m-d') . ' ' . $this->start_time);
        return $bookingDateTime->diffInHours(now()) >= 2;
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function provider()
    {
        return $this->belongsTo(ProviderProfile::class, 'provider_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function slot()
    {
        return $this->belongsTo(AvailabilitySlot::class, 'slot_id');
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    public function commissionRecord()
    {
        return $this->hasOne(CommissionRecord::class);
    }

    public function dispute()
    {
        return $this->hasOne(Dispute::class);
    }
}
