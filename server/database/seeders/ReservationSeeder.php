<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $hotelIds = DB::table('hotels')->pluck('id', 'nom');
        $userIds  = DB::table('users')->pluck('id', 'email');

        $doubleRoomsByHotel = DB::table('chambres')
            ->where('type', 'double')
            ->pluck('id', 'hotel_id');

        $reservations = [
            [
                'user_id'      => $userIds['arwa@example.com'],
                'hotel_id'     => $hotelIds['El Mouradi El Menzah'],
                'chambre_id'   => $doubleRoomsByHotel[$hotelIds['El Mouradi El Menzah']],
                'date_arrivee' => '2025-07-10',
                'date_depart'  => '2025-07-15',
                'nb_chambres'  => 1,
                'nb_adultes'   => 2,
                'nb_enfants'   => 0,
                'ages_enfants' => json_encode([]),
                'prix_total'   => 2250,
                'statut'       => 'confirmee',
            ],
            [
                'user_id'      => $userIds['mohamed@example.com'],
                'hotel_id'     => $hotelIds['The Orangers Garden Villa & Bungalows'],
                'chambre_id'   => $doubleRoomsByHotel[$hotelIds['The Orangers Garden Villa & Bungalows']],
                'date_arrivee' => '2025-08-01',
                'date_depart'  => '2025-08-08',
                'nb_chambres'  => 1,
                'nb_adultes'   => 2,
                'nb_enfants'   => 2,
                'ages_enfants' => json_encode([4, 8]),
                'prix_total'   => 2170,
                'statut'       => 'confirmee',
            ],
            [
                'user_id'      => $userIds['sana@example.com'],
                'hotel_id'     => $hotelIds['Hasdrubal Prestige Thalassa & Spa Djerba'],
                'chambre_id'   => $doubleRoomsByHotel[$hotelIds['Hasdrubal Prestige Thalassa & Spa Djerba']],
                'date_arrivee' => '2025-09-05',
                'date_depart'  => '2025-09-10',
                'nb_chambres'  => 2,
                'nb_adultes'   => 4,
                'nb_enfants'   => 1,
                'ages_enfants' => json_encode([6]),
                'prix_total'   => 3800,
                'statut'       => 'en_attente',
            ],
            [
                'user_id'      => $userIds['yassine@example.com'],
                'hotel_id'     => $hotelIds['Djerba Plaza Thalasso & Spa'],
                'chambre_id'   => $doubleRoomsByHotel[$hotelIds['Djerba Plaza Thalasso & Spa']],
                'date_arrivee' => '2025-07-20',
                'date_depart'  => '2025-07-25',
                'nb_chambres'  => 1,
                'nb_adultes'   => 2,
                'nb_enfants'   => 0,
                'ages_enfants' => json_encode([]),
                'prix_total'   => 2100,
                'statut'       => 'annulee',
            ],
            [
                'user_id'      => $userIds['rania@example.com'],
                'hotel_id'     => $hotelIds['Mövenpick Resort & Marine Spa Sousse'],
                'chambre_id'   => $doubleRoomsByHotel[$hotelIds['Mövenpick Resort & Marine Spa Sousse']],
                'date_arrivee' => '2025-10-01',
                'date_depart'  => '2025-10-05',
                'nb_chambres'  => 1,
                'nb_adultes'   => 2,
                'nb_enfants'   => 0,
                'ages_enfants' => json_encode([]),
                'prix_total'   => 2080,
                'statut'       => 'confirmee',
            ],
        ];

        foreach ($reservations as $reservation) {
            DB::table('reservations')->insert([
                ...$reservation,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
