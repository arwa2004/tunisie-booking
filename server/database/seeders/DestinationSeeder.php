<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Destination;

class DestinationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $destinations = [
            [
                'nom' => 'Hammamet',
                'region' => 'Nabeul',
                'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60'
            ],
            [
                'nom' => 'Djerba',
                'region' => 'Médenine',
                'image' => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=60'
            ],
            [
                'nom' => 'Sousse',
                'region' => 'Sousse',
                'image' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60'
            ],
            [
                'nom' => 'Tabarka',
                'region' => 'Jendouba',
                'image' => 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&auto=format'
            ],
            [
                'nom' => 'Tozeur',
                'region' => 'Tozeur',
                'image' => 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&auto=format'
            ]
        ];
        foreach ($destinations as $destination) {
            Destination::create($destination);
        }
    }
}
