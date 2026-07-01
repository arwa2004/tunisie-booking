<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['nom' => 'Ben Amar',    'prenom' => 'Arwa',    'email' => 'arwa@example.com',    'telephone' => '20123456'],
            ['nom' => 'Trabelsi',    'prenom' => 'Mohamed', 'email' => 'mohamed@example.com', 'telephone' => '22334455'],
            ['nom' => 'Bouazizi',    'prenom' => 'Sana',    'email' => 'sana@example.com',    'telephone' => '55667788'],
            ['nom' => 'Chaabane',    'prenom' => 'Yassine', 'email' => 'yassine@example.com', 'telephone' => '99887766'],
            ['nom' => 'Jebali',      'prenom' => 'Rania',   'email' => 'rania@example.com',   'telephone' => '54321098'],
        ];

        foreach ($users as $user) {
            DB::table('users')->insert([
                'nom'        => $user['nom'],
                'prenom'     => $user['prenom'],
                'email'      => $user['email'],
                'telephone'  => $user['telephone'],
                'password'   => Hash::make('password123'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
