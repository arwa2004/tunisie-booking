<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\User;
use App\Models\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): array
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        return [$user, $token];
    }

    private function makeHotel(): Hotel
    {
        $dest = Destination::factory()->create();
        return Hotel::factory()->create([
            'destination_id' => $dest->id,
            'prix_par_nuit'  => 200,
        ]);
    }

    // ✅ POST sans token → 401
    public function test_create_reservation_without_token_returns_401(): void
    {
        $res = $this->postJson('/api/reservations', []);
        $res->assertStatus(401);
    }

    // ✅ POST avec données invalides → 422
    public function test_create_reservation_with_invalid_data_returns_422(): void
    {
        [, $token] = $this->makeUser();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson('/api/reservations', [
                        'hotel_id' => 9999, // n'existe pas
                    ]);

        $res->assertStatus(422);
    }

    // ✅ POST valide → 201 + prix calculé automatiquement
    public function test_create_reservation_valid_returns_201_with_prix(): void
    {
        [, $token] = $this->makeUser();
        $hotel     = $this->makeHotel();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson('/api/reservations', [
                        'hotel_id'     => $hotel->id,
                        'date_arrivee' => '2026-08-01',
                        'date_depart'  => '2026-08-04', // 3 nuits
                        'nb_chambres'  => 1,
                        'nb_adultes'   => 2,
                        'nb_enfants'   => 0,
                    ]);

        $res->assertStatus(201)
            ->assertJsonFragment([
                'prix_total' => 600, // 3 nuits × 200 DT × 1 chambre
                'statut'     => 'en_attente',
            ]);
    }
}
