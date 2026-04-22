<?php

namespace Database\Seeders;

use App\Models\Neighborhood;
use Illuminate\Database\Seeder;

class NeighborhoodSeeder extends Seeder
{
    public function run(): void
    {
        $dncc = [
            'Uttara', 'Uttara West', 'Uttara East', 'Khilkhet', 'Vatara',
            'Turag', 'Dakshinkhan', 'Uttarkhan', 'Bhatara', 'Khilbarirtek',
            'Gulshan', 'Banani', 'Nikunja', 'Bashundhara', 'Baridhara',
            'Cantonment', 'Airport', 'Kafrul', 'Pallabi', 'Mirpur 1',
            'Mirpur 2', 'Mirpur 6', 'Mirpur 10', 'Mirpur 11', 'Mirpur 12',
            'Mirpur 13', 'Mirpur 14', 'Rupnagar', 'Shah Ali', 'Sher-e-Bangla Nagar',
            'Adabor', 'Mohammadpur', 'Dhanmondi', 'Kalabagan', 'New Market',
            'Tejgaon', 'Tejgaon Industrial Area', 'Hatirjheel', 'Rampura',
        ];

        $dscc = [
            'Motijheel', 'Sabujbagh', 'Khilgaon', 'Jatrabari', 'Demra',
            'Shyampur', 'Kadamtali', 'Sutrapur', 'Wari', 'Kotwali',
            'Bangshal', 'Chalkbazar', 'Lalbagh', 'Hazaribagh', 'Kamrangirchar',
            'Keraniganj', 'Shyamnagar', 'Gandaria', 'Gendaria', 'Ramna',
            'Shahbagh', 'Paltan', 'Dhaka Cantonment', 'Old Dhaka',
            'Nawabganj', 'Demra (South)', 'Postogola', 'Pagla',
        ];

        foreach ($dncc as $name) {
            Neighborhood::updateOrCreate(
                ['name' => $name, 'corporation' => 'DNCC'],
                ['is_active' => true]
            );
        }

        foreach ($dscc as $name) {
            Neighborhood::updateOrCreate(
                ['name' => $name, 'corporation' => 'DSCC'],
                ['is_active' => true]
            );
        }
    }
}
