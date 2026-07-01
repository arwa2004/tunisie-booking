<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    protected $fillable = [
        'nom',
        'region',
        'image',
    ];

    // Une destination a plusieurs hôtels
    public function hotels()
    {
        return $this->hasMany(Hotel::class);
    }
}
