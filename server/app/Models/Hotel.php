<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'destination_id',
        'nom',
        'prix_par_nuit',
        'etoiles',
        'description',
        'image',
        'disponible'
    ];

    // Un hôtel appartient à une destination
    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    // Un hôtel a plusieurs réservations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
