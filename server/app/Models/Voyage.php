<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voyage extends Model
{
    protected $fillable = [
        'nom',
        'pays',
        'image',
        'prix',
        'duree',
        'description',
    ];

    // ── Méthodes métier ───────────────────────────────────────────────────

    /**
     * Vérifie que le prix du voyage est strictement positif.
     */
    public function isPrixValide(): bool
    {
        return $this->prix > 0;
    }

    /**
     * Vérifie que la durée du voyage est strictement positive (au moins 1 jour).
     */
    public function isDureeValide(): bool
    {
        return $this->duree >= 1;
    }

    /**
     * Retourne le label de durée formaté, ex. : « 7 jours ».
     */
    public function getDureeLabel(): string
    {
        $jours = (int) $this->duree;
        return $jours <= 1 ? '1 jour' : "{$jours} jours";
    }
}
