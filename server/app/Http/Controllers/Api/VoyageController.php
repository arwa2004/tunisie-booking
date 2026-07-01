<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voyage;

class VoyageController extends Controller
{
    public function index()
    {
        return response()->json(Voyage::all());
    }

    public function show(string $id)
    {
        $voyage = Voyage::find($id);

        if (!$voyage) {
            return response()->json(['message' => 'Voyage non trouvé.'], 404);
        }

        return response()->json($voyage);
    }
}
