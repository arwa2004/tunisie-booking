<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chambre extends Model
{
    use HasFactory;

    protected $fillable = [
        'hotel_id',
        'type',
        'nom',
        'prix_base_nuit',
        'capacite_adultes',
        'capacite_enfants',
        'quantite'
    ];

    // ── Relations ─────────────────────────────────────────────────────────

    /** Une chambre appartient à un hôtel */
    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    /** Une chambre peut avoir plusieurs réservations */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    /** Une chambre peut proposer plusieurs formules de pension */
    public function pensions()
    {
        return $this->belongsToMany(Pension::class, 'chambre_pension')
                    ->withPivot('supplement_prix')
                    ->withTimestamps();
    }

    // ── Méthodes métier ───────────────────────────────────────────────────

    /**
     * Vérifie si la chambre peut accueillir le nombre d'adultes et d'enfants demandés.
     */
    public function peutAccueillir(int $adultes, int $enfants): bool
    {
        return $adultes <= $this->capacite_adultes && $enfants <= $this->capacite_enfants;
    }
}
