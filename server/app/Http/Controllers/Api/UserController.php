<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET /api/users → liste tous les users (admin)
    public function index()
    {
        $users = User::withCount('reservations')->get();
        return response()->json($users);
    }

    // GET /api/users/{id} → un user
    public function show($id)
    {
        $user = User::with('reservations')->find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        return response()->json($user);
    }

    // DELETE /api/users/{id} → supprimer un user
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}
