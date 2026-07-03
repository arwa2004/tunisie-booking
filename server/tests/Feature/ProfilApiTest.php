<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfilApiTest extends TestCase
{
    use RefreshDatabase;

    // ✅ GET /me → retourne l'utilisateur connecté
    public function test_me_returns_authenticated_user(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->getJson('/api/me');

        $res->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);
    }

    // ✅ PUT /me → met à jour le profil
    public function test_update_profile_updates_correctly(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->putJson('/api/me', [
                        'nom'       => 'Nouveau',
                        'prenom'    => 'Prénom',
                        'email'     => $user->email,
                        'telephone' => '+21699999999',
                    ]);

        $res->assertStatus(200)
            ->assertJsonFragment(['nom' => 'Nouveau']);
    }

    // ✅ PUT /me/password avec mauvais mot de passe → 422
    public function test_update_password_wrong_current_returns_422(): void
    {
        $user  = User::factory()->create(['password' => bcrypt('correct123')]);
        $token = $user->createToken('test')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->putJson('/api/me/password', [
                        'current_password'          => 'mauvais_password',
                        'new_password'              => 'nouveau123',
                        'new_password_confirmation' => 'nouveau123',
                    ]);

        $res->assertStatus(422);
    }
}
