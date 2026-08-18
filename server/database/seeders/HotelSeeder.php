<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Hotel;
use App\Models\Destination;
use App\Models\Chambre;
use App\Models\Pension;
use App\Models\Service;
use App\Models\HotelPhoto;

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
            Hotel::firstOrCreate(
                ['nom' => 'El Mouradi El Menzah'],
                [
                    'destination_id' => $hammamet->id,
                    'prix_par_nuit' => 120,
                    'etoiles' => 4,
                    'description' => 'Situé au cœur de la station balnéaire de Yasmine Hammamet, cet hôtel propose un hébergement confortable à proximité directe de la plage.',
                    'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60',
                    'disponible' => true
                ]
            );

            Hotel::firstOrCreate(
                ['nom' => 'The Orangers Garden Villa & Bungalows'],
                [
                    'destination_id' => $hammamet->id,
                    'prix_par_nuit' => 350,
                    'etoiles' => 5,
                    'description' => 'Un luxueux hôtel entouré de jardins d\'orangers avec un accès direct à une plage privée de sable fin.',
                    'image' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=60',
                    'disponible' => true
                ]
            );
        }

        // Hôtels à Djerba
        if ($djerba) {
            Hotel::firstOrCreate(
                ['nom' => 'Hasdrubal Prestige Thalassa & Spa Djerba'],
                [
                    'destination_id' => $djerba->id,
                    'prix_par_nuit' => 450,
                    'etoiles' => 5,
                    'description' => 'Un havre de paix et de luxe sur la magnifique plage de Sidi Mehrez, réputé pour son centre de thalassothérapie haut de gamme.',
                    'image' => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=60',
                    'disponible' => true
                ]
            );

            Hotel::firstOrCreate(
                ['nom' => 'Djerba Plaza Thalasso & Spa'],
                [
                    'destination_id' => $djerba->id,
                    'prix_par_nuit' => 180,
                    'etoiles' => 4,
                    'description' => 'Alliant architecture traditionnelle djerbienne et confort moderne, au milieu d\'une superbe palmeraie.',
                    'image' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop&q=60',
                    'disponible' => true
                ]
            );
        }

        // Hôtels à Sousse
        if ($sousse) {
            Hotel::firstOrCreate(
                ['nom' => 'Mövenpick Resort & Marine Spa Sousse'],
                [
                    'destination_id' => $sousse->id,
                    'prix_par_nuit' => 280,
                    'etoiles' => 5,
                    'description' => 'Idéalement situé au centre de Sousse, avec une plage de sable fin privée, des piscines d\'eau de mer et des restaurants gastronomiques.',
                    'image' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60',
                    'disponible' => true
                ]
            );
        }

        // Générer des chambres pour chaque hôtel
        $hotels = Hotel::all();
        foreach ($hotels as $hotel) {
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Single Standard'],
                [
                    'type' => 'simple',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 0.8),
                    'capacite_adultes' => 1,
                    'capacite_enfants' => 0,
                    'quantite' => 8,
                ]
            );
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Single Vue Piscine'],
                [
                    'type' => 'simple',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 0.95),
                    'capacite_adultes' => 1,
                    'capacite_enfants' => 0,
                    'quantite' => 5,
                ]
            );
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Single Vue Mer'],
                [
                    'type' => 'simple',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.1),
                    'capacite_adultes' => 1,
                    'capacite_enfants' => 0,
                    'quantite' => 3,
                ]
            );

            // --- CHAMBRES DOUBLES ---
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Double Standard'],
                [
                    'type' => 'double',
                    'prix_base_nuit' => $hotel->prix_par_nuit,
                    'capacite_adultes' => 2,
                    'capacite_enfants' => 1,
                    'quantite' => 12,
                ]
            );
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Double Vue Piscine'],
                [
                    'type' => 'double',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.15),
                    'capacite_adultes' => 2,
                    'capacite_enfants' => 1,
                    'quantite' => 8,
                ]
            );
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Double Vue Mer'],
                [
                    'type' => 'double',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.3),
                    'capacite_adultes' => 2,
                    'capacite_enfants' => 1,
                    'quantite' => 6,
                ]
            );

            // --- CHAMBRES TRIPLES ---
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Triple Vue Jardin'],
                [
                    'type' => 'triple',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.3),
                    'capacite_adultes' => 3,
                    'capacite_enfants' => 1,
                    'quantite' => 6,
                ]
            );
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Chambre Triple Vue Mer'],
                [
                    'type' => 'triple',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.55),
                    'capacite_adultes' => 3,
                    'capacite_enfants' => 1,
                    'quantite' => 4,
                ]
            );

            // --- SUITES FAMILIALES ---
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Suite Familiale Standard'],
                [
                    'type' => 'familiale',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.7),
                    'capacite_adultes' => 4,
                    'capacite_enfants' => 2,
                    'quantite' => 4,
                ]
            );
            Chambre::firstOrCreate(
                ['hotel_id' => $hotel->id, 'nom' => 'Suite Familiale Vue Mer'],
                [
                    'type' => 'familiale',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 2.0),
                    'capacite_adultes' => 4,
                    'capacite_enfants' => 2,
                    'quantite' => 3,
                ]
            );
        }

        // ── PENSIONS ──────────────────────────────────────────────────────
        $pensionPD  = Pension::firstOrCreate(['nom' => 'Petit Déjeuner']);
        $pensionDP  = Pension::firstOrCreate(['nom' => 'Demi Pension']);
        $pensionAIS = Pension::firstOrCreate(['nom' => 'All Inclusive Soft']);
        $pensionAI  = Pension::firstOrCreate(['nom' => 'All Inclusive']);

        $chambres = Chambre::all();
        foreach ($chambres as $chambre) {
            $chambre->pensions()->syncWithoutDetaching([
                $pensionPD->id  => ['supplement_prix' => 0],
                $pensionDP->id  => ['supplement_prix' => 40],
                $pensionAIS->id => ['supplement_prix' => 70],
                $pensionAI->id  => ['supplement_prix' => 100],
            ]);
        }

        // ── SERVICES ──────────────────────────────────────────────────────
        $wifi       = Service::firstOrCreate(['nom' => 'WiFi Gratuit'],    ['icone' => '📶']);
        $piscine    = Service::firstOrCreate(['nom' => 'Piscine'],         ['icone' => '🏊']);
        $spa        = Service::firstOrCreate(['nom' => 'Spa & Bien-être'], ['icone' => '💆']);
        $restaurant = Service::firstOrCreate(['nom' => 'Restaurant'],      ['icone' => '🍽️']);
        $parking    = Service::firstOrCreate(['nom' => 'Parking'],         ['icone' => '🅿️']);
        $plage      = Service::firstOrCreate(['nom' => 'Plage Privée'],    ['icone' => '🏖️']);
        $clim       = Service::firstOrCreate(['nom' => 'Climatisation'],   ['icone' => '❄️']);
        $sport      = Service::firstOrCreate(['nom' => 'Salle de Sport'],  ['icone' => '🏋️']);

        $tousLesServices = [$wifi, $piscine, $spa, $restaurant, $parking, $plage, $clim, $sport];

        foreach ($hotels as $hotel) {
            if ($hotel->etoiles >= 5) {
                $hotel->services()->syncWithoutDetaching(collect($tousLesServices)->pluck('id'));
            } elseif ($hotel->etoiles >= 4) {
                $hotel->services()->syncWithoutDetaching([$wifi->id, $piscine->id, $restaurant->id, $parking->id, $clim->id]);
            } else {
                $hotel->services()->syncWithoutDetaching([$wifi->id, $restaurant->id, $parking->id, $clim->id]);
            }
        }

        // ── PHOTOS ────────────────────────────────────────────────────────
        $photosParDefaut = [
            ['url' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'alt_text' => 'Vue extérieure'],
            ['url' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'alt_text' => 'Hall d\'accueil'],
            ['url' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'alt_text' => 'Piscine'],
            ['url' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'alt_text' => 'Chambre'],
        ];

        foreach ($hotels as $hotel) {
            foreach ($photosParDefaut as $index => $photo) {
                HotelPhoto::firstOrCreate(
                    ['hotel_id' => $hotel->id, 'ordre' => $index],
                    [
                        'url'      => $photo['url'],
                        'alt_text' => $photo['alt_text'],
                    ]
                );
            }
        }
    }
}
