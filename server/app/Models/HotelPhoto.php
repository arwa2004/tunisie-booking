<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HotelPhoto extends Model
{
    protected $fillable = ['hotel_id', 'url', 'alt_text', 'ordre'];

    /**
     * Une photo appartient à un hôtel.
     */
    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }
}
