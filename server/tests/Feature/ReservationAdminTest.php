<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\Chambre;
use App\Models\Pension;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationAdminTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('admin')->plainTextToken;
        return [$admin, $token];
    }

    private function makeReservation(): Reservation
    {
        $dest  = Destination::factory()->create();
        $hotel = Hotel::withoutEvents(fn() => Hotel::factory()->create(['destination_id' => $dest->id]));
        $chambre = Chambre::create([
            'hotel_id' => $hotel->id, 'type' => 'double', 'nom' => 'Double',
            'prix_base_nuit' => 200, 'capacite_adultes' => 2, 'capacite_enfants' => 1, 'quantite' => 5,
        ]);
        $user = User::factory()->create();
        return Reservation::create([
            'user_id'      => $user->id,
            'hotel_id'     => $hotel->id,
            'chambre_id'   => $chambre->id,
            'date_arrivee' => '2026-09-01',
            'date_depart'  => '2026-09-05',
            'nb_chambres'  => 1,
            'nb_adultes'   => 2,
            'nb_enfants'   => 0,
            'ages_enfants' => [],
            'prix_total'   => 800,
            'statut'       => 'en_attente',
        ]);
    }

    // ✅ GET /reservations sans token admin → 401
    public function test_get_all_reservations_without_admin_returns_401(): void
    {
        $user  = User::factory()->create(); // client ordinaire
        $token = $user->createToken('u')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->getJson('/api/reservations');

        $res->assertStatus(403);
    }

    // ✅ GET /reservations (admin) → 200 avec liste
    public function test_admin_can_list_all_reservations(): void
    {
        [, $token] = $this->makeAdmin();
        $this->makeReservation();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->getJson('/api/reservations');

        $res->assertStatus(200)->assertJsonCount(1);
    }

    // ✅ PUT statut → confirmee
    public function test_admin_can_confirm_reservation(): void
    {
        [, $token] = $this->makeAdmin();
        $reservation = $this->makeReservation();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->putJson("/api/reservations/{$reservation->id}", ['statut' => 'confirmee']);

        $res->assertStatus(200)->assertJsonFragment(['statut' => 'confirmee']);
    }

    // ✅ PUT statut → annulee
    public function test_admin_can_cancel_reservation(): void
    {
        [, $token] = $this->makeAdmin();
        $reservation = $this->makeReservation();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->putJson("/api/reservations/{$reservation->id}", ['statut' => 'annulee']);

        $res->assertStatus(200)->assertJsonFragment(['statut' => 'annulee']);
    }

    // ✅ PUT statut invalide → 422
    public function test_admin_update_invalid_statut_returns_422(): void
    {
        [, $token] = $this->makeAdmin();
        $reservation = $this->makeReservation();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->putJson("/api/reservations/{$reservation->id}", ['statut' => 'zombie']);

        $res->assertStatus(422);
    }

    // ✅ DELETE réservation → 200
    public function test_admin_can_delete_reservation(): void
    {
        [, $token] = $this->makeAdmin();
        $reservation = $this->makeReservation();

        $res = $this->withHeader('Authorization', "Bearer $token")
                    ->deleteJson("/api/reservations/{$reservation->id}");

        $res->assertStatus(200);
        $this->assertDatabaseMissing('reservations', ['id' => $reservation->id]);
    }
}
