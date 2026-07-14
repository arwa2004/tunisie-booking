<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pension;
use Illuminate\Http\Request;

class PensionController extends Controller
{
    // GET /api/pensions → liste de toutes les pensions (référentiel global)
    // Ex: "Petit Déjeuner", "Demi-pension", "All Inclusive"
    public function index()
    {
        return response()->json(Pension::all());
    }

    // POST /api/pensions → créer une nouvelle formule de pension
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:100|unique:pensions,nom',
        ]);

        $pension = Pension::create($data);

        return response()->json($pension, 201);
    }

    // POST /api/pensions/{pension} (avec _method=PUT) → renommer une pension
    public function update(Request $request, Pension $pension)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:100|unique:pensions,nom,' . $pension->id,
        ]);

        $pension->update($data);

        return response()->json($pension);
    }

    // DELETE /api/pensions/{pension} → supprimer une formule
    public function destroy(Pension $pension)
    {
        $pension->delete();

        return response()->json(['message' => 'Pension supprimée']);
    }
}
