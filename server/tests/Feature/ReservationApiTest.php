<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\Hotel;
use App\Models\Pension;
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

    /**
     * Crée un hôtel SANS déclencher l'événement `created` (qui génère des chambres auto),
     * puis crée manuellement une chambre et une pension liées pour que le test soit prévisible.
     */
    private function makeHotelWithChambre(): array
    {
        $dest = Destination::factory()->create();

        // withoutEvents() évite la génération automatique de chambres dans Hotel::booted()
        $hotel = Hotel::withoutEvents(function () use ($dest) {
            return Hotel::factory()->create([
                'destination_id' => $dest->id,
                'prix_par_nuit'  => 200,
            ]);
        });

        $chambre = Chambre::create([
            'hotel_id'         => $hotel->id,
            'type'             => 'double',
            'nom'              => 'Chambre Double Standard',
            'prix_base_nuit'   => 200,
            'capacite_adultes' => 2,
            'capacite_enfants' => 1,
            'quantite'         => 5,
        ]);

        // Créer une pension et l'attacher à la chambre (supplément 0 = Petit Déjeuner)
        $pension = Pension::firstOrCreate(['nom' => 'Petit Déjeuner']);
        $chambre->pensions()->attach($pension->id, ['supplement_prix' => 0]);

        return [$hotel, $chambre, $pension];
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
        [$hotel, $chambre, $pension] = $this->makeHotelWithChambre();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson('/api/reservations', [
                        'hotel_id'     => $hotel->id,
                        'chambre_id'   => $chambre->id,
                        'pension_id'   => $pension->id,
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

    // ✅ POST avec chambre d'un autre hôtel → 422
    public function test_create_reservation_chambre_wrong_hotel_returns_422(): void
    {
        [, $token] = $this->makeUser();
        [$hotel, , ] = $this->makeHotelWithChambre();

        // Créer une chambre appartenant à un autre hôtel
        $autreHotel = Hotel::withoutEvents(function () {
            $dest2 = Destination::factory()->create();
            return Hotel::factory()->create(['destination_id' => $dest2->id]);
        });
        $autreChambre = Chambre::create([
            'hotel_id'         => $autreHotel->id,
            'type'             => 'simple',
            'nom'              => 'Chambre Simple',
            'prix_base_nuit'   => 100,
            'capacite_adultes' => 1,
            'capacite_enfants' => 0,
            'quantite'         => 3,
        ]);

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson('/api/reservations', [
                        'hotel_id'     => $hotel->id,
                        'chambre_id'   => $autreChambre->id,
                        'date_arrivee' => '2026-08-01',
                        'date_depart'  => '2026-08-04',
                        'nb_chambres'  => 1,
                        'nb_adultes'   => 1,
                        'nb_enfants'   => 0,
                    ]);

        $res->assertStatus(422)
            ->assertJsonFragment(['message' => "La chambre sélectionnée n'appartient pas à cet hôtel."]);
    }

    // ✅ POST avec capacité insuffisante → 422
    public function test_create_reservation_capacite_insuffisante_returns_422(): void
    {
        [, $token] = $this->makeUser();
        [$hotel, $chambre, $pension] = $this->makeHotelWithChambre();

        // La chambre a capacite_adultes=2 — on demande 5 adultes
        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->postJson('/api/reservations', [
                        'hotel_id'     => $hotel->id,
                        'chambre_id'   => $chambre->id,
                        'pension_id'   => $pension->id,
                        'date_arrivee' => '2026-08-01',
                        'date_depart'  => '2026-08-04',
                        'nb_chambres'  => 1,
                        'nb_adultes'   => 5,
                        'nb_enfants'   => 0,
                    ]);

        $res->assertStatus(422);
    }
}
