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

        // Générer des chambres pour chaque hôtel
        $hotels = Hotel::all();
        foreach ($hotels as $hotel) {
            // --- CHAMBRES SIMPLES (1 Adulte) ---
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'simple',
                'nom' => 'Chambre Single Standard',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 0.8),
                'capacite_adultes' => 1,
                'capacite_enfants' => 0,
                'quantite' => 8,
            ]);
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'simple',
                'nom' => 'Chambre Single Vue Piscine',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 0.95),
                'capacite_adultes' => 1,
                'capacite_enfants' => 0,
                'quantite' => 5,
            ]);
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'simple',
                'nom' => 'Chambre Single Vue Mer',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.1),
                'capacite_adultes' => 1,
                'capacite_enfants' => 0,
                'quantite' => 3,
            ]);

            // --- CHAMBRES DOUBLES (2 Adultes) ---
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'double',
                'nom' => 'Chambre Double Standard',
                'prix_base_nuit' => $hotel->prix_par_nuit,
                'capacite_adultes' => 2,
                'capacite_enfants' => 1,
                'quantite' => 12,
            ]);
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'double',
                'nom' => 'Chambre Double Vue Piscine',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.15),
                'capacite_adultes' => 2,
                'capacite_enfants' => 1,
                'quantite' => 8,
            ]);
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'double',
                'nom' => 'Chambre Double Vue Mer',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.3),
                'capacite_adultes' => 2,
                'capacite_enfants' => 1,
                'quantite' => 6,
            ]);

            // --- CHAMBRES TRIPLES (3 Adultes) ---
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'triple',
                'nom' => 'Chambre Triple Vue Jardin',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.3),
                'capacite_adultes' => 3,
                'capacite_enfants' => 1,
                'quantite' => 6,
            ]);
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'triple',
                'nom' => 'Chambre Triple Vue Mer',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.55),
                'capacite_adultes' => 3,
                'capacite_enfants' => 1,
                'quantite' => 4,
            ]);

            // --- SUITES FAMILIALES (4 Adultes) ---
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'familiale',
                'nom' => 'Suite Familiale Standard',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.7),
                'capacite_adultes' => 4,
                'capacite_enfants' => 2,
                'quantite' => 4,
            ]);
            \App\Models\Chambre::create([
                'hotel_id' => $hotel->id,
                'type' => 'familiale',
                'nom' => 'Suite Familiale Vue Mer',
                'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 2.0),
                'capacite_adultes' => 4,
                'capacite_enfants' => 2,
                'quantite' => 3,
            ]);
        }
                // ── PENSIONS ──────────────────────────────────────────────────────
        // On crée les 4 formules de restauration disponibles
        $pensionPD  = \App\Models\Pension::create(['nom' => 'Petit Déjeuner']);
        $pensionDP  = \App\Models\Pension::create(['nom' => 'Demi Pension']);
        $pensionAIS = \App\Models\Pension::create(['nom' => 'All Inclusive Soft']);
        $pensionAI  = \App\Models\Pension::create(['nom' => 'All Inclusive']);

        // Pour chaque chambre, on attache les 4 pensions avec leurs suppléments
        $chambres = \App\Models\Chambre::all();
        foreach ($chambres as $chambre) {
            // attach() crée une ligne dans la table pivot chambre_pension
            $chambre->pensions()->attach($pensionPD->id,  ['supplement_prix' => 0]);
            $chambre->pensions()->attach($pensionDP->id,  ['supplement_prix' => 40]);
            $chambre->pensions()->attach($pensionAIS->id, ['supplement_prix' => 70]);
            $chambre->pensions()->attach($pensionAI->id,  ['supplement_prix' => 100]);
        }

        // ── SERVICES ──────────────────────────────────────────────────────
        // On crée les services que les hôtels peuvent proposer
        $wifi       = \App\Models\Service::create(['nom' => 'WiFi Gratuit',    'icone' => '📶']);
        $piscine    = \App\Models\Service::create(['nom' => 'Piscine',         'icone' => '🏊']);
        $spa        = \App\Models\Service::create(['nom' => 'Spa & Bien-être', 'icone' => '💆']);
        $restaurant = \App\Models\Service::create(['nom' => 'Restaurant',      'icone' => '🍽️']);
        $parking    = \App\Models\Service::create(['nom' => 'Parking',         'icone' => '🅿️']);
        $plage      = \App\Models\Service::create(['nom' => 'Plage Privée',    'icone' => '🏖️']);
        $clim       = \App\Models\Service::create(['nom' => 'Climatisation',   'icone' => '❄️']);
        $sport      = \App\Models\Service::create(['nom' => 'Salle de Sport',  'icone' => '🏋️']);

        // On attache des services différents selon les hôtels
        $tousLesServices = [$wifi, $piscine, $spa, $restaurant, $parking, $plage, $clim, $sport];

        foreach ($hotels as $hotel) {
            if ($hotel->etoiles >= 5) {
                // Les 5 étoiles ont TOUS les services
                $hotel->services()->attach(collect($tousLesServices)->pluck('id'));
            } elseif ($hotel->etoiles >= 4) {
                // Les 4 étoiles ont les services de base (pas de spa ni plage privée)
                $hotel->services()->attach([$wifi->id, $piscine->id, $restaurant->id, $parking->id, $clim->id]);
            } else {
                // Les 3 étoiles : WiFi, Parking, Restaurant, Clim
                $hotel->services()->attach([$wifi->id, $restaurant->id, $parking->id, $clim->id]);
            }
        }

        // ── PHOTOS ────────────────────────────────────────────────────────
        // On ajoute 4 photos par hôtel (images libres de droit depuis Unsplash)
        $photosParDefaut = [
            ['url' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'alt_text' => 'Vue extérieure'],
            ['url' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'alt_text' => 'Hall d\'accueil'],
            ['url' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'alt_text' => 'Piscine'],
            ['url' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'alt_text' => 'Chambre'],
        ];

        foreach ($hotels as $hotel) {
            foreach ($photosParDefaut as $index => $photo) {
                \App\Models\HotelPhoto::create([
                    'hotel_id' => $hotel->id,
                    'url'      => $photo['url'],
                    'alt_text' => $photo['alt_text'],
                    'ordre'    => $index, // 0, 1, 2, 3
                ]);
            }
        }
    }

}
