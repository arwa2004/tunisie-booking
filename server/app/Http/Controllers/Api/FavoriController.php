<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favori;
use App\Models\Hotel;
use Illuminate\Http\Request;

class FavoriController extends Controller
{
    /**
     * GET /api/favoris
     * Retourne tous les favoris de l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $favoris = Favori::where('user_id', $request->user()->id)
            ->with('hotel.destination')
            ->get()
            ->pluck('hotel');

        return response()->json($favoris);
    }

    /**
     * GET /api/favoris/ids
     * Retourne uniquement les IDs des hôtels mis en favori par l'utilisateur.
     * Utilisé par le frontend pour afficher l'état initial du cœur.
     */
    public function ids(Request $request)
    {
        $ids = Favori::where('user_id', $request->user()->id)
            ->pluck('hotel_id');

        return response()->json($ids);
    }

    /**
     * POST /api/favoris/{hotel}
     * Ajoute ou retire un hôtel des favoris (toggle).
     */
    public function toggle(Request $request, Hotel $hotel)
    {
        $userId = $request->user()->id;

        $existing = Favori::where('user_id', $userId)
            ->where('hotel_id', $hotel->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['favori' => false, 'message' => 'Retiré des favoris']);
        }

        Favori::create([
            'user_id'  => $userId,
            'hotel_id' => $hotel->id,
        ]);

        return response()->json(['favori' => true, 'message' => 'Ajouté aux favoris']);
    }
}
