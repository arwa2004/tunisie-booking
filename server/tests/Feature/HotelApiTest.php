<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\User;
use App\Models\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HotelApiTest extends TestCase
{
    use RefreshDatabase;

    private function createHotel(): Hotel
    {
        $destination = Destination::factory()->create();
        return Hotel::factory()->create([
            'destination_id' => $destination->id
        ]);
    }

    // ✅ GET /hotels → renvoie une liste
    public function test_get_hotels_returns_list(): void
    {
        $this->createHotel();
        $this->createHotel();

        $res = $this->getJson('/api/hotels');

        $res->assertStatus(200)
            ->assertJsonCount(2);
    }

    // ✅ GET /hotels/{id} → renvoie le bon hôtel
    public function test_get_hotel_by_id_returns_correct_hotel(): void
    {
        $hotel = $this->createHotel();

        $res = $this->getJson("/api/hotels/{$hotel->id}");

        $res->assertStatus(200)
            ->assertJsonFragment(['nom' => $hotel->nom]);
    }

    // ✅ GET /hotels/{id} inexistant → 404
    public function test_get_hotel_inexistant_returns_404(): void
    {
        $res = $this->getJson('/api/hotels/9999');
        $res->assertStatus(404);
    }

    // ✅ POST /hotels sans token → 401
    public function test_create_hotel_without_token_returns_401(): void
    {
        $res = $this->postJson('/api/hotels', [
            'nom'          => 'Hotel Test',
            'prix_par_nuit'=> 150,
            'etoiles'      => 4,
        ]);

        $res->assertStatus(401);
    }

    // ✅ POST /hotels avec token → 201
    public function test_create_hotel_with_token_returns_201(): void
{
    // Créer un user ADMIN au lieu d'un user normal
    $user        = User::factory()->create(['role' => 'admin']);
    $token       = $user->createToken('test')->plainTextToken;
    $destination = Destination::factory()->create();

    $res = $this->withHeader('Authorization', "Bearer $token")
                ->postJson('/api/hotels', [
                    'destination_id' => $destination->id,
                    'nom'            => 'Hotel Test',
                    'prix_par_nuit'  => 150,
                    'etoiles'        => 4,
                    'disponible'     => true,
                ]);

    $res->assertStatus(201)
        ->assertJsonFragment(['nom' => 'Hotel Test']);
}
}
