<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ServiceCategory extends Model
{
    protected $fillable = ['name', 'slug', 'icon', 'description', 'is_active', 'sort_order'];
    protected $casts = ['is_active' => 'boolean'];
    public function providers() { return $this->hasMany(ProviderProfile::class, 'category_id'); }
}
