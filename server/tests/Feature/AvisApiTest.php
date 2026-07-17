<?php

namespace Tests\Feature;

use App\Models\Avis;
use App\Models\Hotel;
use App\Models\User;
use App\Models\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvisApiTest extends TestCase
{
    use RefreshDatabase;

    private function createHotel(): Hotel
    {
        $destination = Destination::factory()->create();
        return Hotel::withoutEvents(function () use ($destination) {
            return Hotel::factory()->create([
                'destination_id' => $destination->id
            ]);
        });
    }

    public function test_get_avis_returns_list_and_stats(): void
    {
        $hotel = $this->createHotel();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        Avis::create([
            'hotel_id' => $hotel->id,
            'user_id' => $user1->id,
            'note_globale' => 8,
            'note_qualite_prix' => 8,
            'note_chambres' => 9,
            'commentaire' => 'Super hôtel !'
        ]);

        Avis::create([
            'hotel_id' => $hotel->id,
            'user_id' => $user2->id,
            'note_globale' => 6,
            'note_qualite_prix' => 6,
            'note_chambres' => 6,
            'commentaire' => 'Moyen'
        ]);

        $res = $this->getJson("/api/hotels/{$hotel->id}/avis");

        $res->assertStatus(200)
            ->assertJsonStructure([
                'count',
                'pct_recommande',
                'moyennes' => [
                    'globale',
                    'qualite_prix',
                    'chambres'
                ],
                'avis'
            ])
            ->assertJsonPath('count', 2)
            ->assertJsonPath('pct_recommande', 50); // 1 out of 2 (note_globale >= 7)
    }

    public function test_post_avis_without_token_returns_401(): void
    {
        $hotel = $this->createHotel();

        $res = $this->postJson("/api/hotels/{$hotel->id}/avis", [
            'note_globale' => 8,
            'commentaire' => 'Génial'
        ]);

        $res->assertStatus(401);
    }

    public function test_post_avis_with_token_creates_or_updates(): void
    {
        $hotel = $this->createHotel();
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Créer un premier avis
        $res = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/hotels/{$hotel->id}/avis", [
                'note_globale' => 9,
                'note_proprete' => 10,
                'commentaire' => 'Top !'
            ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('avis', [
            'hotel_id' => $hotel->id,
            'user_id' => $user->id,
            'note_globale' => 9,
            'commentaire' => 'Top !'
        ]);

        // Mettre à jour l'avis
        $resUpdate = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/hotels/{$hotel->id}/avis", [
                'note_globale' => 8,
                'commentaire' => 'Moins bien finalement.'
            ]);

        $resUpdate->assertStatus(201);
        $this->assertDatabaseHas('avis', [
            'hotel_id' => $hotel->id,
            'user_id' => $user->id,
            'note_globale' => 8,
            'commentaire' => 'Moins bien finalement.'
        ]);
        $this->assertDatabaseCount('avis', 1);
    }

    public function test_post_avis_invalid_notes_returns_422(): void
    {
        $hotel = $this->createHotel();
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/hotels/{$hotel->id}/avis", [
                'note_globale' => 12, // invalide (> 10)
                'commentaire' => 'Faux'
            ]);

        $res->assertStatus(422);
    }

    public function test_delete_avis_authorized(): void
    {
        $hotel = $this->createHotel();
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $avis = Avis::create([
            'hotel_id' => $hotel->id,
            'user_id' => $user->id,
            'note_globale' => 8,
        ]);

        $res = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson("/api/avis/{$avis->id}");

        $res->assertStatus(200);
        $this->assertDatabaseMissing('avis', ['id' => $avis->id]);
    }
}
