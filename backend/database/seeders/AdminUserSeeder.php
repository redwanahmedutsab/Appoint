<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@appointly.com.bd'],
            [
                'name'     => 'Appointly Admin',
                'password' => Hash::make('Admin@1234'),
                'role'     => 'admin',
                'status'   => 'active',
                'phone'    => '01700000000',
            ]
        );
    }
}
