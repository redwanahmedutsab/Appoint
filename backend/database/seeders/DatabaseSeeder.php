<?php

namespace Database\Seeders;

use App\Models\Neighborhood;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ServiceCategorySeeder::class,
            NeighborhoodSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
