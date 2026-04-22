<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CommissionRecord extends Model
{
    protected $fillable = [
        'booking_id', 'provider_id', 'service_amount', 'commission_rate',
        'commission_amount', 'settlement_status', 'week_start', 'week_end',
        'settled_at', 'settled_by',
    ];
    protected $casts = [
        'week_start' => 'date', 'week_end' => 'date', 'settled_at' => 'datetime',
        'service_amount' => 'decimal:2', 'commission_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
    ];
    public function booking() { return $this->belongsTo(Booking::class); }
    public function provider() { return $this->belongsTo(ProviderProfile::class, 'provider_id'); }
}
