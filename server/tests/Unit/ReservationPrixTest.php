<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ReservationPrixTest extends TestCase
{
    // ── Calcul prix total ─────────────────────────────────────────────

    public function test_calcul_prix_total_correct(): void
    {
        $prixParNuit = 200;
        $nbNuits     = 4;
        $nbChambres  = 2;

        $prixTotal = $prixParNuit * $nbNuits * $nbChambres;

        $this->assertEquals(1600, $prixTotal);
    }

    public function test_calcul_nb_nuits_correct(): void
    {
        $arrivee = new \DateTime('2025-08-01');
        $depart  = new \DateTime('2025-08-05');
        $nbNuits = $arrivee->diff($depart)->days;

        $this->assertEquals(4, $nbNuits);
    }

    public function test_nb_nuits_zero_si_meme_date(): void
    {
        $arrivee = new \DateTime('2025-08-01');
        $depart  = new \DateTime('2025-08-01');
        $nbNuits = $arrivee->diff($depart)->days;

        $this->assertEquals(0, $nbNuits);
    }

    public function test_prix_total_une_nuit_une_chambre(): void
    {
        $prixParNuit = 350;
        $nbNuits     = 1;
        $nbChambres  = 1;

        $prixTotal = $prixParNuit * $nbNuits * $nbChambres;

        $this->assertEquals(350, $prixTotal);
    }

    public function test_prix_total_plusieurs_chambres(): void
    {
        $prixParNuit = 100;
        $nbNuits     = 7;
        $nbChambres  = 3;

        $prixTotal = $prixParNuit * $nbNuits * $nbChambres;

        $this->assertEquals(2100, $prixTotal);
    }
}
