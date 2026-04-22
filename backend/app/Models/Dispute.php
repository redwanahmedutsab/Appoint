<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Dispute extends Model
{
    protected $fillable = ['booking_id', 'raised_by', 'description', 'status', 'resolution', 'resolved_by', 'resolved_at'];
    protected $casts = ['resolved_at' => 'datetime'];
    public function booking() { return $this->belongsTo(Booking::class); }
    public function raisedBy() { return $this->belongsTo(User::class, 'raised_by'); }
    public function resolvedBy() { return $this->belongsTo(User::class, 'resolved_by'); }
}
