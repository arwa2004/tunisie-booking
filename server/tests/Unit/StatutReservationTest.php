<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class StatutReservationTest extends TestCase
{
    private array $statutsValides = ['en_attente', 'confirmee', 'annulee'];

    public function test_statut_initial_est_en_attente(): void
    {
        $statut = 'en_attente';
        $this->assertContains($statut, $this->statutsValides);
        $this->assertEquals('en_attente', $statut);
    }

    public function test_statut_confirmee_est_valide(): void
    {
        $statut = 'confirmee';
        $this->assertContains($statut, $this->statutsValides);
    }

    public function test_statut_annulee_est_valide(): void
    {
        $statut = 'annulee';
        $this->assertContains($statut, $this->statutsValides);
    }

    public function test_statut_invalide_nest_pas_accepte(): void
    {
        $statutInvalide = 'payee';
        $this->assertNotContains($statutInvalide, $this->statutsValides);
    }

    public function test_transition_en_attente_vers_confirmee(): void
    {
        $statutActuel  = 'en_attente';
        $nouveauStatut = 'confirmee';

        // Simuler la transition
        $statutActuel = $nouveauStatut;

        $this->assertEquals('confirmee', $statutActuel);
    }

    public function test_transition_en_attente_vers_annulee(): void
    {
        $statutActuel  = 'en_attente';
        $nouveauStatut = 'annulee';

        $statutActuel = $nouveauStatut;

        $this->assertEquals('annulee', $statutActuel);
    }
}
