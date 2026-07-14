<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\Hotel;
use App\Models\Pension;
use App\Models\User;
use App\Models\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChambreApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('admin')->plainTextToken;
        return [$admin, $token];
    }

    private function makeHotel(): Hotel
    {
        $dest = Destination::factory()->create();
        return Hotel::withoutEvents(function () use ($dest) {
            return Hotel::factory()->create(['destination_id' => $dest->id, 'prix_par_nuit' => 150]);
        });
    }

    // ✅ GET /hotels/{id}/chambres → liste publique
    public function test_get_chambres_returns_list(): void
    {
        $hotel = $this->makeHotel();
        Chambre::create([
            'hotel_id' => $hotel->id, 'type' => 'double', 'nom' => 'Double Standard',
            'prix_base_nuit' => 150, 'capacite_adultes' => 2, 'capacite_enfants' => 1, 'quantite' => 5,
        ]);

        $res = $this->getJson("/api/hotels/{$hotel->id}/chambres");
        $res->assertStatus(200)->assertJsonCount(1);
    }

    // ✅ GET chambre inexistante → 404
    public function test_get_chambre_inexistante_returns_404(): void
    {
        $res = $this->getJson('/api/chambres/9999');
        $res->assertStatus(404);
    }

    // ✅ POST créer chambre sans token → 401
    public function test_create_chambre_without_token_returns_401(): void
    {
        $hotel = $this->makeHotel();
        $res = $this->postJson("/api/hotels/{$hotel->id}/chambres", []);
        $res->assertStatus(401);
    }

    // ✅ POST créer chambre valide (admin) → 201
    public function test_create_chambre_valid_returns_201(): void
    {
        [, $token] = $this->makeAdmin();
        $hotel = $this->makeHotel();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson("/api/hotels/{$hotel->id}/chambres", [
                        'type'             => 'triple',
                        'nom'              => 'Chambre Triple Vue Mer',
                        'prix_base_nuit'   => 250,
                        'capacite_adultes' => 3,
                        'capacite_enfants' => 1,
                        'quantite'         => 4,
                    ]);

        $res->assertStatus(201)
            ->assertJsonFragment(['nom' => 'Chambre Triple Vue Mer', 'prix_base_nuit' => 250]);
    }

    // ✅ PUT modifier prix chambre (admin) → 200
    public function test_update_chambre_prix_returns_200(): void
    {
        [, $token] = $this->makeAdmin();
        $hotel = $this->makeHotel();
        $chambre = Chambre::create([
            'hotel_id' => $hotel->id, 'type' => 'simple', 'nom' => 'Chambre Simple',
            'prix_base_nuit' => 100, 'capacite_adultes' => 1, 'capacite_enfants' => 0, 'quantite' => 3,
        ]);

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson("/api/chambres/{$chambre->id}", [
                        'prix_base_nuit' => 180,
                        'quantite'       => 5,
                        'nom'            => 'Chambre Simple',
                    ]);

        $res->assertStatus(200)
            ->assertJsonFragment(['prix_base_nuit' => 180, 'quantite' => 5]);
    }

    // ✅ DELETE chambre (admin) → 200
    public function test_delete_chambre_returns_200(): void
    {
        [, $token] = $this->makeAdmin();
        $hotel = $this->makeHotel();
        $chambre = Chambre::create([
            'hotel_id' => $hotel->id, 'type' => 'simple', 'nom' => 'À supprimer',
            'prix_base_nuit' => 90, 'capacite_adultes' => 1, 'capacite_enfants' => 0, 'quantite' => 2,
        ]);

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->deleteJson("/api/chambres/{$chambre->id}");

        $res->assertStatus(200)->assertJsonFragment(['message' => 'Chambre supprimée']);
        $this->assertDatabaseMissing('chambres', ['id' => $chambre->id]);
    }
}
