<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{

public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nom' => 'required|string|max:255',
        'prenom' => 'required|string|max:255',
        'telephone' => 'required|string|max:20',
        'email' => 'required|string|email|max:255|unique:users',
        // Mot de passe renforcé : 8 caractères min + majuscule + chiffre
        'password' => [
            'required',
            'string',
            'min:8',
            'confirmed', // attend password_confirmation
            'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
        ],
    ], [
        'password.regex' => 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $user = User::create([
        'nom' => $request->nom,
        'prenom' => $request->prenom,
        'telephone' => $request->telephone,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => 'client', // toujours en dur, jamais depuis $request
    ]);

    $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
    ], 201);
}


public function login(Request $request)
{
    $validator = Validator::make($request->all(), [
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        // Log de la tentative échouée (utile pour détecter une attaque)
        \Illuminate\Support\Facades\Log::channel('security')->warning('Échec de connexion', [
            'email' => $request->email,
            'ip' => $request->ip(),
        ]);

        return response()->json(['message' => 'Identifiants incorrects'], 401);
    }

    $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
    ]);
}


    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // PUT /api/me → un user met à jour ses propres infos (jamais son role)
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'required|string|max:20',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'telephone' => $request->telephone,
            'email' => $request->email,
        ]);

        return response()->json([
            'message' => 'Profil mis à jour',
            'user' => $user->fresh(),
        ]);
    }

    // PUT /api/me/password → changement de mot de passe
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed', // attend new_password_confirmation
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'errors' => ['current_password' => ['Mot de passe actuel incorrect.']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json(['message' => 'Mot de passe modifié avec succès']);
    }

    public function updatePhoto(Request $request)
{
    $request->validate([
        'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2Mo max
    ]);

    $user = $request->user();

    if ($request->hasFile('photo')) {
        // Supprime l'ancienne photo du serveur si elle existe pour ne pas encombrer le disque
        if ($user->photo && file_exists(public_path($user->photo))) {
            @unlink(public_path($user->photo));
        }

        $file = $request->file('photo');
        // Génère un nom unique
        $fileName = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();

        // Déplace le fichier vers public/uploads/avatars/
        $file->move(public_path('uploads/avatars'), $fileName);

        $path = '/uploads/avatars/' . $fileName;
        $user->update(['photo' => $path]);

        return response()->json([
            'message' => 'Photo de profil mise à jour.',
            'user' => $user->fresh(),
        ]);
    }

    return response()->json(['message' => 'Aucun fichier détecté.'], 400);
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté']);
    }


public function logoutAll(Request $request)
{
    $request->user()->tokens()->delete();

    return response()->json(['message' => 'Déconnecté de tous les appareils']);
}
}
