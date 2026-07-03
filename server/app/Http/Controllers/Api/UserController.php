<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET /api/users → liste tous les users (Super Admin uniquement)
    public function index(Request $request)
    {
        if ($request->user()->email !== 'admin@gmail.com') {
            return response()->json(['message' => 'Accès réservé au Super Admin.'], 403);
        }

        $users = User::withCount('reservations')->get();
        return response()->json($users);
    }

    // GET /api/users/{id} → un user (Super Admin uniquement)
    public function show(Request $request, $id)
    {
        if ($request->user()->email !== 'admin@gmail.com') {
            return response()->json(['message' => 'Accès réservé au Super Admin.'], 403);
        }

        $user = User::with('reservations')->find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        return response()->json($user);
    }

    // PUT /api/users/{id}/role → modifier le rôle d'un user (Super Admin uniquement)
    public function updateRole(Request $request, $id)
    {
        if ($request->user()->email !== 'admin@gmail.com') {
            return response()->json(['message' => 'Accès réservé au Super Admin.'], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        // Interdire de rétrograder le super admin originel
        if ($user->email === 'admin@gmail.com') {
            return response()->json(['message' => 'Impossible de modifier le rôle du Super Admin.'], 422);
        }

        $request->validate([
            'role' => 'required|in:admin,client',
        ]);

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Rôle mis à jour avec succès.',
            'user' => $user->loadCount('reservations')
        ]);
    }

    // DELETE /api/users/{id} → supprimer un user (Super Admin uniquement)
    public function destroy(Request $request, $id)
    {
        if ($request->user()->email !== 'admin@gmail.com') {
            return response()->json(['message' => 'Accès réservé au Super Admin.'], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        if ($user->email === 'admin@gmail.com') {
            return response()->json(['message' => 'Impossible de supprimer le Super Admin.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}
