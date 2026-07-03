<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voyage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VoyageController extends Controller
{
    // GET /api/voyages
    public function index()
    {
        return response()->json(Voyage::all());
    }

    // GET /api/voyages/{id}
    public function show(string $id)
    {
        $voyage = Voyage::find($id);

        if (!$voyage) {
            return response()->json(['message' => 'Voyage non trouvé.'], 404);
        }

        return response()->json($voyage);
    }

    // POST /api/voyages
    public function store(Request $request)
    {
        $request->validate([
            'nom'         => 'required|string',
            'pays'        => 'required|string',
            'prix'        => 'required|numeric',
            'duree'       => 'required|integer',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('voyages', 'public');
            $imagePath = '/storage/' . $imagePath;
        }

        $voyage = Voyage::create([
            'nom'         => $request->nom,
            'pays'        => $request->pays,
            'prix'        => $request->prix,
            'duree'       => $request->duree,
            'description' => $request->description,
            'image'       => $imagePath,
        ]);

        return response()->json($voyage, 201);
    }

    // PUT /api/voyages/{id}
    public function update(Request $request, string $id)
    {
        $voyage = Voyage::find($id);

        if (!$voyage) {
            return response()->json(['message' => 'Voyage non trouvé.'], 404);
        }

        $request->validate([
            'nom'         => 'sometimes|string',
            'pays'        => 'sometimes|string',
            'prix'        => 'sometimes|numeric',
            'duree'       => 'sometimes|integer',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Upload nouvelle image si fournie
        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image
            if ($voyage->image) {
                $oldPath = str_replace('/storage/', '', $voyage->image);
                Storage::disk('public')->delete($oldPath);
            }
            $imagePath = $request->file('image')->store('voyages', 'public');
            $voyage->image = '/storage/' . $imagePath;
        }

        $voyage->nom         = $request->nom         ?? $voyage->nom;
        $voyage->pays        = $request->pays        ?? $voyage->pays;
        $voyage->prix        = $request->prix        ?? $voyage->prix;
        $voyage->duree       = $request->duree       ?? $voyage->duree;
        $voyage->description = $request->description ?? $voyage->description;
        $voyage->save();

        return response()->json($voyage);
    }

    // DELETE /api/voyages/{id}
    public function destroy(string $id)
    {
        $voyage = Voyage::find($id);

        if (!$voyage) {
            return response()->json(['message' => 'Voyage non trouvé.'], 404);
        }

        // Supprimer l'image associée
        if ($voyage->image) {
            $oldPath = str_replace('/storage/', '', $voyage->image);
            Storage::disk('public')->delete($oldPath);
        }

        $voyage->delete();

        return response()->json(['message' => 'Voyage supprimé.']);
    }
}
