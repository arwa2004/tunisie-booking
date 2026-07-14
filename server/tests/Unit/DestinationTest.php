<?php

namespace Tests\Unit;

use App\Models\Destination;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires du modèle Destination.
 *
 * Instanciation manuelle du modèle via setRawAttributes() — sans base de données.
 */
class DestinationTest extends TestCase
{
    // ── Helper ────────────────────────────────────────────────────────────

    private function makeDestination(array $attributs): Destination
    {
        $destination = new Destination();
        $destination->setRawAttributes($attributs);
        return $destination;
    }

    // ── hasNom() ──────────────────────────────────────────────────────────

    public function test_hasNom_retourne_true_si_nom_renseigne(): void
    {
        $destination = $this->makeDestination(['nom' => 'Tunis', 'region' => 'Grand Tunis']);

        $this->assertTrue($destination->hasNom());
    }

    public function test_hasNom_retourne_false_si_nom_vide(): void
    {
        $destination = $this->makeDestination(['nom' => '', 'region' => 'Nord']);

        $this->assertFalse($destination->hasNom());
    }

    public function test_hasNom_retourne_false_si_nom_manquant(): void
    {
        $destination = $this->makeDestination(['region' => 'Nord']);

        $this->assertFalse($destination->hasNom());
    }

    // ── hasRegion() ───────────────────────────────────────────────────────

    public function test_hasRegion_retourne_true_si_region_renseignee(): void
    {
        $destination = $this->makeDestination(['nom' => 'Sousse', 'region' => 'Sahel']);

        $this->assertTrue($destination->hasRegion());
    }

    public function test_hasRegion_retourne_false_si_region_vide(): void
    {
        $destination = $this->makeDestination(['nom' => 'Sousse', 'region' => '']);

        $this->assertFalse($destination->hasRegion());
    }

    // ── getNomComplet() ───────────────────────────────────────────────────

    public function test_getNomComplet_retourne_format_correct(): void
    {
        $destination = $this->makeDestination(['nom' => 'Djerba', 'region' => 'Médenine']);

        $this->assertEquals('Djerba (Médenine)', $destination->getNomComplet());
    }
}
