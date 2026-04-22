<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Salons & Parlours',         'slug' => 'salons-parlours',         'icon' => 'scissors',       'description' => 'Hair salons, beauty parlours, nail studios', 'sort_order' => 1],
            ['name' => 'Clinics & Diagnostics',     'slug' => 'clinics-diagnostics',     'icon' => 'stethoscope',    'description' => 'General physicians, specialist clinics, diagnostic centers', 'sort_order' => 2],
            ['name' => 'Laundry & Dry Cleaning',    'slug' => 'laundry-dry-cleaning',    'icon' => 'shirt',          'description' => 'Laundry services and dry cleaning', 'sort_order' => 3],
            ['name' => 'Consultancy Services',      'slug' => 'consultancy-services',    'icon' => 'briefcase',      'description' => 'Legal, financial, career and business consultancy', 'sort_order' => 4],
            ['name' => 'Tuition & Coaching',        'slug' => 'tuition-coaching',        'icon' => 'book-open',      'description' => 'Private tuition, coaching centers, skill development', 'sort_order' => 5],
        ];

        foreach ($categories as $cat) {
            ServiceCategory::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
