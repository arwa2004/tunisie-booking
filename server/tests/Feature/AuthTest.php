<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ✅ Register → reçoit un token
    public function test_register_returns_token(): void
    {
        $res = $this->postJson('/api/register', [
            'nom'                  => 'Ben Ali',
            'prenom'               => 'Ahmed',
            'email'                => 'ahmed@test.com',
            'telephone'            => '+21612345678',
            'password'             => 'password123',
            'password_confirmation'=> 'password123',
        ]);

        $res->assertStatus(201)
            ->assertJsonStructure(['token', 'user']);
    }

    // ✅ Login correct → 200
    public function test_login_correct_returns_200(): void
    {
        User::factory()->create([
            'email'    => 'test@test.com',
            'password' => bcrypt('password123'),
        ]);

        $res = $this->postJson('/api/login', [
            'email'    => 'test@test.com',
            'password' => 'password123',
        ]);

        $res->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    // ✅ Login mauvais mot de passe → 401
    public function test_login_wrong_password_returns_401(): void
    {
        User::factory()->create([
            'email'    => 'test@test.com',
            'password' => bcrypt('password123'),
        ]);

        $res = $this->postJson('/api/login', [
            'email'    => 'test@test.com',
            'password' => 'mauvais_password',
        ]);

        $res->assertStatus(401);
    }

    // ✅ Logout → token révoqué
    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson('/api/logout');

        $res->assertStatus(200);

        // Vérifier que le token est révoqué
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
