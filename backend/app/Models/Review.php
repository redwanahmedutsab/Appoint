<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = ['booking_id', 'user_id', 'provider_id', 'rating', 'review_text', 'is_visible'];
    protected $casts = ['is_visible' => 'boolean'];

    public function booking() { return $this->belongsTo(Booking::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function provider() { return $this->belongsTo(ProviderProfile::class, 'provider_id'); }
}
