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
}
