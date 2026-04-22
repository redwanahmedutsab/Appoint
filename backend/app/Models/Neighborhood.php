<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Neighborhood extends Model
{
    protected $fillable = ['name', 'corporation', 'zone', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function providers() { return $this->hasMany(ProviderProfile::class); }
}
