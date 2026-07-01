<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DestinationSeeder::class,  // 1er (pas de dépendances)
            HotelSeeder::class,        // 2e (dépend des destinations)
            VoyageSeeder::class,       // 3e (indépendant)
            UserSeeder::class,         // 4e (indépendant)
            ReservationSeeder::class,  // 5e (dépend des users + hotels)
        ]);
    }
}
