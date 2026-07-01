<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HotelDisponibiliteTest extends TestCase
{
    public function test_hotel_disponible_retourne_true(): void
    {
        $hotel = ['disponible' => true, 'nom' => 'Hotel Test'];
        $this->assertTrue($hotel['disponible']);
    }

    public function test_hotel_indisponible_retourne_false(): void
    {
        $hotel = ['disponible' => false, 'nom' => 'Hotel Complet'];
        $this->assertFalse($hotel['disponible']);
    }

    public function test_etoiles_entre_1_et_5(): void
    {
        $etoilesValides = [1, 2, 3, 4, 5];

        foreach ($etoilesValides as $etoiles) {
            $this->assertGreaterThanOrEqual(1, $etoiles);
            $this->assertLessThanOrEqual(5, $etoiles);
        }
    }

    public function test_prix_par_nuit_positif(): void
    {
        $prix = 200;
        $this->assertGreaterThan(0, $prix);
    }
}
