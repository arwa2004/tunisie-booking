<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pension extends Model
{
    protected $fillable = ['nom'];

    /**
     * Une pension est disponible dans plusieurs chambres.
     * withPivot('supplement_prix') permet d'accéder au supplément
     * quand on fait : $chambre->pensions (chaque pension aura ->pivot->supplement_prix)
     */
    public function chambres()
    {
        return $this->belongsToMany(Chambre::class, 'chambre_pension')
                    ->withPivot('supplement_prix')
    //withPivot() lui dit : "charge aussi cette colonne supplémentaire depuis la table pivot"
                    ->withTimestamps();
    }
}
