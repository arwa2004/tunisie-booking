<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Avis extends Model
{
    protected $table = 'avis';

    protected $fillable = [
        'hotel_id',
        'user_id',
        'note_globale',
        'note_qualite_prix',
        'note_chambres',
        'note_emplacement',
        'note_proprete',
        'note_services',
        'note_equipements',
        'commentaire',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
