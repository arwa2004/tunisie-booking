<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Compte admin — idempotent : on n'insère que s'il n'existe pas déjà
        if (! DB::table('users')->where('email', 'admin@gmail.com')->exists()) {
            DB::table('users')->insert([
                'nom'        => 'Admin',
                'prenom'     => 'Super',
                'email'      => 'admin@gmail.com',
                'telephone'  => '00000000',
                'password'   => Hash::make('admin1234'),
                'role'       => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Clients de démonstration — idempotent aussi
        $clients = [
            ['nom' => 'Ben Amar',    'prenom' => 'Arwa',    'email' => 'arwa@example.com',    'telephone' => '20123456'],
            ['nom' => 'Trabelsi',    'prenom' => 'Mohamed', 'email' => 'mohamed@example.com', 'telephone' => '22334455'],
            ['nom' => 'Bouazizi',    'prenom' => 'Sana',    'email' => 'sana@example.com',    'telephone' => '55667788'],
        ];

        foreach ($clients as $client) {
            if (DB::table('users')->where('email', $client['email'])->exists()) {
                continue;
            }
            DB::table('users')->insert([
                'nom'        => $client['nom'],
                'prenom'     => $client['prenom'],
                'email'      => $client['email'],
                'telephone'  => $client['telephone'],
                'password'   => Hash::make('password123'),
                'role'       => 'client',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "✅ Utilisateurs de démonstration présents (1 admin + clients).\n";
    }
}
