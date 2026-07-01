<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Hotel;
use App\Models\Destination;

class HotelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // On récupère nos destinations pour lier les hôtels
        $hammamet = Destination::where('nom', 'Hammamet')->first();
        $djerba = Destination::where('nom', 'Djerba')->first();
        $sousse = Destination::where('nom', 'Sousse')->first();

        // Hôtels à Hammamet
        if ($hammamet) {
            Hotel::create([
                'destination_id' => $hammamet->id,
                'nom' => 'El Mouradi El Menzah',
                'prix_par_nuit' => 120,
                'etoiles' => 4,
                'description' => 'Situé au cœur de la station balnéaire de Yasmine Hammamet, cet hôtel propose un hébergement confortable à proximité directe de la plage.',
                'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60',
                'disponible' => true
            ]);

            Hotel::create([
                'destination_id' => $hammamet->id,
                'nom' => 'The Orangers Garden Villa & Bungalows',
                'prix_par_nuit' => 350,
                'etoiles' => 5,
                'description' => 'Un luxueux hôtel entouré de jardins d\'orangers avec un accès direct à une plage privée de sable fin.',
                'image' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=60',
                'disponible' => true
            ]);
        }

        // Hôtels à Djerba
        if ($djerba) {
            Hotel::create([
                'destination_id' => $djerba->id,
                'nom' => 'Hasdrubal Prestige Thalassa & Spa Djerba',
                'prix_par_nuit' => 450,
                'etoiles' => 5,
                'description' => 'Un havre de paix et de luxe sur la magnifique plage de Sidi Mehrez, réputé pour son centre de thalassothérapie haut de gamme.',
                'image' => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=60',
                'disponible' => true
            ]);

            Hotel::create([
                'destination_id' => $djerba->id,
                'nom' => 'Djerba Plaza Thalasso & Spa',
                'prix_par_nuit' => 180,
                'etoiles' => 4,
                'description' => 'Alliant architecture traditionnelle djerbienne et confort moderne, au milieu d\'une superbe palmeraie.',
                'image' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop&q=60',
                'disponible' => true
            ]);
        }

        // Hôtels à Sousse
        if ($sousse) {
            Hotel::create([
                'destination_id' => $sousse->id,
                'nom' => 'Mövenpick Resort & Marine Spa Sousse',
                'prix_par_nuit' => 280,
                'etoiles' => 5,
                'description' => 'Idéalement situé au centre de Sousse, avec une plage de sable fin privée, des piscines d\'eau de mer et des restaurants gastronomiques.',
                'image' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60',
                'disponible' => true
            ]);
        }
    }
}
