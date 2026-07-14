<?php

namespace Tests\Unit;

use App\Models\Hotel;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires du modèle Hotel.
 *
 * Instanciation manuelle du modèle via setRawAttributes() — sans base de données.
 */
class HotelTest extends TestCase
{
    // ── Helper ────────────────────────────────────────────────────────────

    private function makeHotel(array $attributs): Hotel
    {
        $hotel = new Hotel();
        $hotel->setRawAttributes($attributs);
        return $hotel;
    }

    // ── isDisponible() ────────────────────────────────────────────────────

    public function test_isDisponible_retourne_true_quand_disponible(): void
    {
        $hotel = $this->makeHotel(['disponible' => true]);

        $this->assertTrue($hotel->isDisponible());
    }

    public function test_isDisponible_retourne_false_quand_indisponible(): void
    {
        $hotel = $this->makeHotel(['disponible' => false]);

        $this->assertFalse($hotel->isDisponible());
    }

    // ── isEtoilesValide() ─────────────────────────────────────────────────

    public function test_isEtoilesValide_retourne_true_pour_1_a_5(): void
    {
        foreach ([1, 2, 3, 4, 5] as $etoiles) {
            $hotel = $this->makeHotel(['etoiles' => $etoiles]);
            $this->assertTrue(
                $hotel->isEtoilesValide(),
                "Attendu valide pour {$etoiles} étoile(s)"
            );
        }
    }

    public function test_isEtoilesValide_retourne_false_pour_zero(): void
    {
        $hotel = $this->makeHotel(['etoiles' => 0]);

        $this->assertFalse($hotel->isEtoilesValide());
    }

    public function test_isEtoilesValide_retourne_false_pour_six(): void
    {
        $hotel = $this->makeHotel(['etoiles' => 6]);

        $this->assertFalse($hotel->isEtoilesValide());
    }

    // ── isPrixValide() ────────────────────────────────────────────────────

    public function test_isPrixValide_retourne_true_pour_prix_positif(): void
    {
        $hotel = $this->makeHotel(['prix_par_nuit' => 200]);

        $this->assertTrue($hotel->isPrixValide());
    }

    public function test_isPrixValide_retourne_false_pour_prix_zero(): void
    {
        $hotel = $this->makeHotel(['prix_par_nuit' => 0]);

        $this->assertFalse($hotel->isPrixValide());
    }

    public function test_isPrixValide_retourne_false_pour_prix_negatif(): void
    {
        $hotel = $this->makeHotel(['prix_par_nuit' => -50]);

        $this->assertFalse($hotel->isPrixValide());
    }
}
