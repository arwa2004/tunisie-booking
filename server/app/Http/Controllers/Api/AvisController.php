<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avis;
use App\Models\Hotel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AvisController extends Controller
{
    /**
     * GET /api/hotels/{hotel}/avis
     * Retourne tous les avis + moyennes calculées pour un hôtel.
     */
    public function index(Hotel $hotel)
    {
        $avis = $hotel->avis()
            ->with('user:id,nom,prenom')
            ->latest()
            ->get();

        $count = $avis->count();

        $moyennes = $count > 0 ? [
            'globale'       => round($avis->avg('note_globale'), 1),
            'qualite_prix'  => round($avis->whereNotNull('note_qualite_prix')->avg('note_qualite_prix'), 1),
            'chambres'      => round($avis->whereNotNull('note_chambres')->avg('note_chambres'), 1),
            'emplacement'   => round($avis->whereNotNull('note_emplacement')->avg('note_emplacement'), 1),
            'proprete'      => round($avis->whereNotNull('note_proprete')->avg('note_proprete'), 1),
            'services'      => round($avis->whereNotNull('note_services')->avg('note_services'), 1),
            'equipements'   => round($avis->whereNotNull('note_equipements')->avg('note_equipements'), 1),
        ] : null;

        $pctRecommande = $count > 0
            ? round($avis->where('note_globale', '>=', 7)->count() / $count * 100)
            : 0;

        return response()->json([
            'count'          => $count,
            'moyennes'       => $moyennes,
            'pct_recommande' => $pctRecommande,
            'avis'           => $avis,
        ]);
    }

    /**
     * POST /api/hotels/{hotel}/avis
     * Crée ou met à jour l'avis de l'utilisateur connecté pour cet hôtel.
     */
    public function store(Request $request, Hotel $hotel)
    {
        $validated = $request->validate([
            'note_globale'      => 'required|integer|between:1,10',
            'note_qualite_prix' => 'nullable|integer|between:1,10',
            'note_chambres'     => 'nullable|integer|between:1,10',
            'note_emplacement'  => 'nullable|integer|between:1,10',
            'note_proprete'     => 'nullable|integer|between:1,10',
            'note_services'     => 'nullable|integer|between:1,10',
            'note_equipements'  => 'nullable|integer|between:1,10',
            'commentaire'       => 'nullable|string|max:2000',
        ]);

        $avis = Avis::updateOrCreate(
            ['hotel_id' => $hotel->id, 'user_id' => Auth::id()],
            $validated
        );

        return response()->json($avis->load('user:id,nom,prenom'), 201);
    }

    /**
     * DELETE /api/avis/{avis}
     * Supprime son propre avis (admin ou auteur).
     */
    public function destroy(Avis $avis)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' && $avis->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }
        $avis->delete();
        return response()->json(['message' => 'Avis supprimé.']);
    }
}
