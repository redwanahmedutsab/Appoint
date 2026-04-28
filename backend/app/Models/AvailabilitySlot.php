<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AvailabilitySlot extends Model
{
    protected $fillable = ['provider_id', 'date', 'start_time', 'end_time', 'is_booked', 'is_blocked'];
    protected $casts = ['date' => 'date:Y-m-d', 'is_booked' => 'boolean', 'is_blocked' => 'boolean'];

    public function provider() { return $this->belongsTo(ProviderProfile::class, 'provider_id'); }
    public function booking() { return $this->hasOne(Booking::class, 'slot_id'); }

    public function isAvailable(): bool { return !$this->is_booked && !$this->is_blocked; }
}
