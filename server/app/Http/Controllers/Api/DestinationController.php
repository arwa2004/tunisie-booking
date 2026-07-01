<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DestinationController extends Controller
{
    public function index()
    {
        return response()->json(Destination::all());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom'    => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'image'  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('destinations', 'public');
            $data['image'] = '/storage/' . $path;
        }

        $destination = Destination::create($data);

        return response()->json($destination, 201);
    }

    public function show(string $id)
    {
        $destination = Destination::with('hotels')->find($id);

        if (!$destination) {
            return response()->json(['message' => 'Destination non trouvée.'], 404);
        }

        return response()->json($destination);
    }

    public function update(Request $request, string $id)
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json(['message' => 'Destination non trouvée.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom'    => 'sometimes|required|string|max:255',
            'region' => 'sometimes|required|string|max:255',
            'image'  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('image')) {
            if ($destination->image && str_starts_with($destination->image, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $destination->image));
            }
            $path = $request->file('image')->store('destinations', 'public');
            $data['image'] = '/storage/' . $path;
        }

        $destination->update($data);

        return response()->json($destination);
    }

    public function destroy(string $id)
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json(['message' => 'Destination non trouvée.'], 404);
        }

        if ($destination->image && str_starts_with($destination->image, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $destination->image));
        }

        $destination->delete();

        return response()->json(['message' => 'Destination supprimée avec succès.']);
    }
}
