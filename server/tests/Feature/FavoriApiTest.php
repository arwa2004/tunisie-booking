<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriApiTest extends TestCase
{
    use RefreshDatabase;

    private function createHotel(): Hotel
    {
        $dest = Destination::create([
            'nom' => 'Hammamet',
            'region' => 'Cap Bon',
            'image' => 'dest.jpg'
        ]);

        return Hotel::create([
            'nom' => 'Hotel Test',
            'description' => 'Super hotel',
            'etoiles' => 4,
            'prix_par_nuit' => 120,
            'destination_id' => $dest->id,
            'image' => 'hotel.jpg'
        ]);
    }

    public function test_unauthorized_user_cannot_access_favoris(): void
    {
        $response = $this->getJson('/api/favoris');
        $response->assertStatus(401);
    }

    public function test_user_can_toggle_hotel_favori(): void
    {
        $user = User::factory()->create();
        $hotel = $this->createHotel();

        // 1. Ajouter aux favoris
        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/favoris/{$hotel->id}");

        $response->assertStatus(200)
            ->assertJson(['favori' => true, 'message' => 'Ajouté aux favoris']);

        $this->assertDatabaseHas('favoris', [
            'user_id' => $user->id,
            'hotel_id' => $hotel->id,
        ]);

        // 2. Vérifier les IDs favoris
        $responseIds = $this->actingAs($user, 'sanctum')
            ->getJson('/api/favoris/ids');

        $responseIds->assertStatus(200)
            ->assertJson([$hotel->id]);

        // 3. Retirer des favoris (toggle)
        $responseToggle = $this->actingAs($user, 'sanctum')
            ->postJson("/api/favoris/{$hotel->id}");

        $responseToggle->assertStatus(200)
            ->assertJson(['favori' => false, 'message' => 'Retiré des favoris']);

        $this->assertDatabaseMissing('favoris', [
            'user_id' => $user->id,
            'hotel_id' => $hotel->id,
        ]);
    }

    public function test_user_can_get_favoris_list(): void
    {
        $user = User::factory()->create();
        $hotel = $this->createHotel();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/favoris/{$hotel->id}");

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/favoris');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['nom' => 'Hotel Test']);
    }
}
