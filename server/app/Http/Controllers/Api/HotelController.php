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
        $query = Hotel::with(['destination', 'photos']);

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

        $hotels = $query->get();

        return response()->json($hotels);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_id'          => 'required|exists:destinations,id',
            'nom'                     => 'required|string|max:255',
            'prix_par_nuit'           => 'required|integer|min:0',
            'etoiles'                 => 'required|integer|min:1|max:5',
            'description'             => 'nullable|string',
            'disponible'              => 'nullable|boolean',
            'image'                   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            'age_max_bebe'            => 'nullable|integer|min:0|max:10',
            'age_max_enfant'          => 'nullable|integer|min:0|max:17',
            'supplement_enfant'       => 'nullable|numeric|min:0',
            'supplement_grand_enfant' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'destination_id', 'nom', 'prix_par_nuit', 'etoiles', 'description',
            'disponible', 'age_max_bebe', 'age_max_enfant', 'supplement_enfant', 'supplement_grand_enfant'
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('hotels', 'public');
            $data['image'] = Storage::url($path);
        }

        $hotel = Hotel::create($data);

        return response()->json([
            'message' => 'Hôtel créé avec succès',
            'hotel'   => $hotel->load('destination')
        ], 201);
    }

    public function show($id)
    {
        $hotel = Hotel::with(['destination', 'chambres.pensions', 'services', 'photos', 'avis.user'])->find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hôtel non trouvé'], 404);
        }

        return response()->json($hotel);
    }

    public function update(Request $request, $id)
    {
        $hotel = Hotel::find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hôtel non trouvé'], 404);
        }

        $validator = Validator::make($request->all(), [
            'destination_id'          => 'sometimes|required|exists:destinations,id',
            'nom'                     => 'sometimes|required|string|max:255',
            'prix_par_nuit'           => 'sometimes|required|integer|min:0',
            'etoiles'                 => 'sometimes|required|integer|min:1|max:5',
            'description'             => 'nullable|string',
            'disponible'              => 'nullable|boolean',
            'image'                   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            'age_max_bebe'            => 'nullable|integer|min:0|max:10',
            'age_max_enfant'          => 'nullable|integer|min:0|max:17',
            'supplement_enfant'       => 'nullable|numeric|min:0',
            'supplement_grand_enfant' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'destination_id', 'nom', 'prix_par_nuit', 'etoiles', 'description',
            'disponible', 'age_max_bebe', 'age_max_enfant', 'supplement_enfant', 'supplement_grand_enfant'
        ]);

        if ($request->hasFile('image')) {
            if ($hotel->image && Storage::disk('public')->exists(str_replace('/storage/', '', $hotel->image))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $hotel->image));
            }

            $path = $request->file('image')->store('hotels', 'public');
            $data['image'] = Storage::url($path);
        }

        $hotel->update($data);

        return response()->json([
            'message' => 'Hôtel mis à jour avec succès',
            'hotel'   => $hotel->load('destination')
        ]);
    }

    public function destroy($id)
    {
        $hotel = Hotel::find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hôtel non trouvé'], 404);
        }

        if ($hotel->image && Storage::disk('public')->exists(str_replace('/storage/', '', $hotel->image))) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $hotel->image));
        }

        $hotel->delete();

        return response()->json(['message' => 'Hôtel supprimé avec succès']);
    }
}
