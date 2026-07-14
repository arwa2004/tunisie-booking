<?php

namespace Tests\Unit;

use App\Models\Reservation;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires du modèle Reservation.
 *
 * Ces tests vérifient les méthodes métier du modèle sans accès à la base de
 * données (pas de RefreshDatabase). On instancie le modèle manuellement et on
 * renseigne ses attributs via setRawAttributes().
 */
class ReservationTest extends TestCase
{
    // ── Helpers ───────────────────────────────────────────────────────────

    /** Crée une Reservation avec les attributs donnés sans toucher à la BDD. */
    private function makeReservation(array $attributs): Reservation
    {
        $reservation = new Reservation();
        if (isset($attributs['ages_enfants']) && is_array($attributs['ages_enfants'])) {
            $attributs['ages_enfants'] = json_encode($attributs['ages_enfants']);
        }
        $reservation->setRawAttributes($attributs);
        return $reservation;
    }

    // ── getNbNuits() ──────────────────────────────────────────────────────

    public function test_getNbNuits_retourne_nombre_correct(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-01',
            'date_depart'  => '2025-08-05',
        ]);

        $this->assertEquals(4, $reservation->getNbNuits()); //vérifie que les deux valeurs sont égales
    }

    public function test_getNbNuits_retourne_zero_si_meme_date(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-01',
            'date_depart'  => '2025-08-01',
        ]);

        $this->assertEquals(0, $reservation->getNbNuits());
    }

    public function test_getNbNuits_retourne_zero_si_depart_avant_arrivee(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-10',
            'date_depart'  => '2025-08-05',
        ]);

        $this->assertEquals(0, $reservation->getNbNuits());
    }

    public function test_getNbNuits_retourne_zero_si_dates_manquantes(): void
    {
        $reservation = $this->makeReservation([]);

        $this->assertEquals(0, $reservation->getNbNuits());
    }

    // ── calculatePrixTotal() ──────────────────────────────────────────────

    public function test_calculatePrixTotal_correct_sans_enfants(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-01',
            'date_depart'  => '2025-08-05',  // 4 nuits
            'nb_chambres'  => 2,
            'ages_enfants' => [],
        ]);

        // 200 DT/nuit × 4 nuits × 2 chambres = 1600 DT
        $this->assertEquals(1600.0, $reservation->calculatePrixTotal(200));
    }

    public function test_calculatePrixTotal_avec_enfants_de_differents_ages(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-01',
            'date_depart'  => '2025-08-05',  // 4 nuits
            'nb_chambres'  => 1,
            'ages_enfants' => [1, 5, 14], // 1 (<2 ans: gratuit), 5 (2-12 ans: +30 DT), 14 (>12 ans: +50 DT) -> total supplement = 80 DT / nuit
        ]);

        // (200 DT/chambre + 80 DT suppléments) × 4 nuits × 1 chambre = 280 * 4 = 1120 DT
        $this->assertEquals(1120.0, $reservation->calculatePrixTotal(200));
    }

    public function test_calculatePrixTotal_une_nuit_une_chambre_sans_enfants(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-01',
            'date_depart'  => '2025-08-02',  // 1 nuit
            'nb_chambres'  => 1,
            'ages_enfants' => [],
        ]);

        $this->assertEquals(350.0, $reservation->calculatePrixTotal(350));
    }

    public function test_calculatePrixTotal_zero_si_meme_date(): void
    {
        $reservation = $this->makeReservation([
            'date_arrivee' => '2025-08-01',
            'date_depart'  => '2025-08-01',  // 0 nuit
            'nb_chambres'  => 3,
            'ages_enfants' => [6],
        ]);

        $this->assertEquals(0.0, $reservation->calculatePrixTotal(200));
    }

    // ── isStatutValide() ──────────────────────────────────────────────────

    public function test_isStatutValide_retourne_true_pour_en_attente(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertTrue($reservation->isStatutValide('en_attente'));
    }

    public function test_isStatutValide_retourne_true_pour_confirmee(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertTrue($reservation->isStatutValide('confirmee'));
    }

    public function test_isStatutValide_retourne_true_pour_annulee(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertTrue($reservation->isStatutValide('annulee'));
    }

    public function test_isStatutValide_retourne_false_pour_statut_inconnu(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertFalse($reservation->isStatutValide('payee'));
        $this->assertFalse($reservation->isStatutValide(''));
        $this->assertFalse($reservation->isStatutValide('CONFIRMEE'));
    }

    // ── canTransitionTo() ────────────────────────────────────────────────

    public function test_canTransitionTo_en_attente_vers_confirmee(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertTrue($reservation->canTransitionTo('confirmee'));
    }

    public function test_canTransitionTo_en_attente_vers_annulee(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertTrue($reservation->canTransitionTo('annulee'));
    }

    public function test_canTransitionTo_annulee_est_etat_terminal(): void
    {
        $reservation = $this->makeReservation(['statut' => 'annulee']);

        $this->assertFalse($reservation->canTransitionTo('confirmee'));
        $this->assertFalse($reservation->canTransitionTo('en_attente'));
    }

    public function test_canTransitionTo_retourne_false_pour_statut_invalide(): void
    {
        $reservation = $this->makeReservation(['statut' => 'en_attente']);

        $this->assertFalse($reservation->canTransitionTo('payee'));
    }

    // ── getStatutsValides() ───────────────────────────────────────────────

    public function test_getStatutsValides_contient_les_trois_statuts(): void
    {
        $statuts = Reservation::getStatutsValides();

        $this->assertContains('en_attente', $statuts); //verifie que tableau contient en_attente
        $this->assertContains('confirmee',  $statuts); //verifie que tableau contient confirmee
        $this->assertContains('annulee',    $statuts); //verifie que tableau contient annulee
        $this->assertCount(3, $statuts); //verifie le nombre de statut eli houwa 3
    }
}
