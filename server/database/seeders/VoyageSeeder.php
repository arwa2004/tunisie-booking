<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Voyage;

class VoyageSeeder extends Seeder
{
    public function run(): void
    {
        $voyages = [
            [
                'nom'         => 'Paris',
                'pays'        => 'France',
                'image'       => 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
                'prix'        => 850.00,
                'duree'       => 7,
                'description' => 'La ville lumière vous accueille avec ses musées, sa gastronomie et son romantisme légendaire.',
            ],
            [
                'nom'         => 'Dubai',
                'pays'        => 'Émirats Arabes Unis',
                'image'       => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
                'prix'        => 1200.00,
                'duree'       => 5,
                'description' => 'La ville du futur entre gratte-ciels vertigineux, plages de rêve et shopping de luxe.',
            ],
            [
                'nom'         => 'Istanbul',
                'pays'        => 'Turquie',
                'image'       => 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600',
                'prix'        => 650.00,
                'duree'       => 6,
                'description' => 'Le carrefour entre Orient et Occident, entre mosquées majestueuses et bazars colorés.',
            ],
            [
                'nom'         => 'Rome',
                'pays'        => 'Italie',
                'image'       => 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
                'prix'        => 750.00,
                'duree'       => 5,
                'description' => 'La ville éternelle, berceau de la civilisation occidentale, entre Colisée et Vatican.',
            ],
        ];

        foreach ($voyages as $voyage) {
            Voyage::create($voyage);
        }
    }
}
