<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HotelController extends Controller
{
    public function index(Request $request)
    {
        $query = Hotel::with('destination');

        if ($request->has('destination_id')) {
            $query->where('destination_id', $request->input('destination_id'));
        }
        if ($request->has('etoiles')) {
            $query->where('etoiles', $request->input('etoiles'));
        }
        if ($request->has('prix_max')) {
            $query->where('prix_par_nuit', '<=', $request->input('prix_max'));
        }
        if ($request->has('disponible')) {
            $query->where('disponible', $request->boolean('disponible'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_id' => 'required|exists:destinations,id',
            'nom'            => 'required|string|max:255',
            'prix_par_nuit'  => 'required|integer|min:0',
            'etoiles'        => 'required|integer|min:1|max:5',
            'description'    => 'nullable|string',
            'disponible'     => 'nullable|boolean',
            'image'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096', // 4 Mo max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('hotels', 'public');
            $data['image'] = '/storage/' . $path;
        }

        $data['disponible'] = $request->boolean('disponible', true);

        $hotel = Hotel::create($data);

        return response()->json($hotel->load('destination'), 201);
    }

    public function show(string $id)
    {
        $hotel = Hotel::with('destination')->find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hôtel non trouvé.'], 404);
        }

        return response()->json($hotel);
    }

    public function update(Request $request, string $id)
    {
        $hotel = Hotel::find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hôtel non trouvé.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'destination_id' => 'sometimes|required|exists:destinations,id',
            'nom'            => 'sometimes|required|string|max:255',
            'prix_par_nuit'  => 'sometimes|required|integer|min:0',
            'etoiles'        => 'sometimes|required|integer|min:1|max:5',
            'description'    => 'nullable|string',
            'disponible'     => 'nullable|boolean',
            'image'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image si elle existe en local
            if ($hotel->image && str_starts_with($hotel->image, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $hotel->image);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('hotels', 'public');
            $data['image'] = '/storage/' . $path;
        }

        if ($request->has('disponible')) {
            $data['disponible'] = $request->boolean('disponible');
        }

        $hotel->update($data);

        return response()->json($hotel->load('destination'));
    }

    public function destroy(string $id)
    {
        $hotel = Hotel::find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hôtel non trouvé.'], 404);
        }

        if ($hotel->image && str_starts_with($hotel->image, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $hotel->image);
            Storage::disk('public')->delete($oldPath);
        }

        $hotel->delete();

        return response()->json(['message' => 'Hôtel supprimé avec succès.']);
    }
}
