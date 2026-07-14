<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['nom', 'icone'];

    /**
     * Un service peut être proposé par plusieurs hôtels.
     */
    public function hotels()
    {
        return $this->belongsToMany(Hotel::class, 'hotel_service')
                    ->withTimestamps();
    }
}
