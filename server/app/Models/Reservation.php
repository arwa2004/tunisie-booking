<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'hotel_id',
        'date_arrivee',
        'date_depart',
        'nb_chambres',
        'nb_adultes',
        'nb_enfants',
        'prix_total',
        'statut'
    ];

    // Une réservation appartient à un user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Une réservation appartient à un hôtel
    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }
}
