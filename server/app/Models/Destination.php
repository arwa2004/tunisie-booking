<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'region',
        'image',
    ];

    // ── Relations ─────────────────────────────────────────────────────────

    /** Une destination possède plusieurs hôtels */
    public function hotels()
    {
        return $this->hasMany(Hotel::class);
    }

    // ── Méthodes métier ───────────────────────────────────────────────────

    /**
     * Vérifie que le nom de la destination n'est pas vide.
     */
    public function hasNom(): bool
    {
        return !empty(trim($this->nom ?? ''));
    }

    /**
     * Vérifie que la région de la destination n'est pas vide.
     */
    public function hasRegion(): bool
    {
        return !empty(trim($this->region ?? ''));
    }

    /**
     * Retourne le nom complet formaté : « Nom (Région) ».
     */
    public function getNomComplet(): string
    {
        return sprintf('%s (%s)', $this->nom, $this->region);
    }
}
