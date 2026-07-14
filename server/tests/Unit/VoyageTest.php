<?php

namespace Tests\Unit;

use App\Models\Voyage;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires du modèle Voyage.
 *
 * Instanciation manuelle du modèle via setRawAttributes() — sans base de données.
 */
class VoyageTest extends TestCase
{
    // ── Helper ────────────────────────────────────────────────────────────

    private function makeVoyage(array $attributs): Voyage
    {
        $voyage = new Voyage();
        $voyage->setRawAttributes($attributs);
        return $voyage;
    }

    // ── isPrixValide() ────────────────────────────────────────────────────

    public function test_isPrixValide_retourne_true_pour_prix_positif(): void
    {
        $voyage = $this->makeVoyage(['prix' => 1500, 'duree' => 7]);

        $this->assertTrue($voyage->isPrixValide());
    }

    public function test_isPrixValide_retourne_false_pour_prix_zero(): void
    {
        $voyage = $this->makeVoyage(['prix' => 0, 'duree' => 7]);

        $this->assertFalse($voyage->isPrixValide());
    }

    public function test_isPrixValide_retourne_false_pour_prix_negatif(): void
    {
        $voyage = $this->makeVoyage(['prix' => -200, 'duree' => 7]);

        $this->assertFalse($voyage->isPrixValide());
    }

    // ── isDureeValide() ───────────────────────────────────────────────────

    public function test_isDureeValide_retourne_true_pour_un_jour(): void
    {
        $voyage = $this->makeVoyage(['prix' => 500, 'duree' => 1]);

        $this->assertTrue($voyage->isDureeValide());
    }

    public function test_isDureeValide_retourne_true_pour_une_semaine(): void
    {
        $voyage = $this->makeVoyage(['prix' => 1500, 'duree' => 7]);

        $this->assertTrue($voyage->isDureeValide());
    }

    public function test_isDureeValide_retourne_false_pour_zero_jour(): void
    {
        $voyage = $this->makeVoyage(['prix' => 500, 'duree' => 0]);

        $this->assertFalse($voyage->isDureeValide());
    }

    // ── getDureeLabel() ───────────────────────────────────────────────────

    public function test_getDureeLabel_retourne_un_jour_au_singulier(): void
    {
        $voyage = $this->makeVoyage(['duree' => 1]);

        $this->assertEquals('1 jour', $voyage->getDureeLabel());
    }

    public function test_getDureeLabel_retourne_pluriel_pour_plusieurs_jours(): void
    {
        $voyage = $this->makeVoyage(['duree' => 10]);

        $this->assertEquals('10 jours', $voyage->getDureeLabel());
    }
}
