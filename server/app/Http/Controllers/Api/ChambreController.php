<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chambre;
use App\Models\Hotel;
use Illuminate\Http\Request;

class ChambreController extends Controller
{
    // GET /api/hotels/{hotel}/chambres → toutes les chambres d'un hôtel
    public function index(Hotel $hotel)
    {
        return response()->json(
            $hotel->chambres()->with('pensions')->get()
        );
    }

    // GET /api/chambres/{chambre} → une chambre précise
    public function show(Chambre $chambre)
    {
        return response()->json($chambre->load('pensions'));
    }

    // POST /api/hotels/{hotel}/chambres → créer une chambre pour cet hôtel
    public function store(Request $request, Hotel $hotel)
    {
        $data = $request->validate([
            'type'                => 'required|string|max:50',
            'nom'                 => 'required|string|max:100',
            'prix_base_nuit'      => 'required|numeric|min:0',
            'capacite_adultes'    => 'required|integer|min:1|max:10',
            'capacite_enfants'    => 'required|integer|min:0|max:10',
            'quantite'            => 'required|integer|min:0',
            'remise_pourcentage'  => 'nullable|numeric|min:0|max:100',
        ]);

        $data['hotel_id'] = $hotel->id;

        $chambre = Chambre::create($data);

        return response()->json($chambre, 201);
    }

    // POST /api/chambres/{chambre} (avec _method=PUT) → modifier une chambre
    public function update(Request $request, Chambre $chambre)
    {
        $data = $request->validate([
            'type'                => 'sometimes|required|string|max:50',
            'nom'                 => 'sometimes|required|string|max:100',
            'prix_base_nuit'      => 'sometimes|required|numeric|min:0',
            'capacite_adultes'    => 'sometimes|required|integer|min:1|max:10',
            'capacite_enfants'    => 'sometimes|required|integer|min:0|max:10',
            'quantite'            => 'sometimes|required|integer|min:0',
            'remise_pourcentage'  => 'nullable|numeric|min:0|max:100',
        ]);

        $chambre->update($data);

        return response()->json($chambre->fresh());
    }

    // DELETE /api/chambres/{chambre} → supprimer une chambre
    public function destroy(Chambre $chambre)
    {
        $chambre->delete();

        return response()->json(['message' => 'Chambre supprimée']);
    }

    // POST /api/chambres/{chambre}/pensions → (re)définir les pensions + suppléments d'une chambre
    // Body attendu : { "pensions": [ { "id": 1, "supplement_prix": 0 }, { "id": 2, "supplement_prix": 25 } ] }
    public function syncPensions(Request $request, Chambre $chambre)
    {
        $data = $request->validate([
            'pensions'                   => 'required|array',
            'pensions.*.id'              => 'required|exists:pensions,id',
            'pensions.*.supplement_prix' => 'required|numeric|min:0',
        ]);

        // Construit le tableau attendu par sync() avec les données pivot
        $syncData = collect($data['pensions'])->mapWithKeys(function ($p) {
            return [$p['id'] => ['supplement_prix' => $p['supplement_prix']]];
        })->toArray();

        $chambre->pensions()->sync($syncData);

        return response()->json($chambre->fresh('pensions'));
    }
}
