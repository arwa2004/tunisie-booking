<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur (Client).
     */
    public function register(Request $request)
    {
        // 1. Validation des données entrantes
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'required|string|max:20',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed', // requiert un champ 'password_confirmation'
        ]);

        // 2. Création de l'utilisateur en BDD
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'telephone' => $request->telephone,
            'email' => $request->email,
            'password' => Hash::make($request->password), // On crypte/hache le mot de passe
        ]);

        // 3. Génération du jeton de connexion (Token Sanctum)
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. On renvoie l'utilisateur créé et son jeton
        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Connexion d'un utilisateur existant.
     */
    public function login(Request $request)
    {
        // 1. Validation
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // 2. Vérification de l'utilisateur par son email
        $user = User::where('email', $request->email)->first();

        // 3. Si l'utilisateur n'existe pas OU si le mot de passe est incorrect
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Identifiants incorrects.'
            ], 401);
        }

        // 4. Génération d'un nouveau jeton (Token)
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Déconnexion.
     */
    public function logout(Request $request)
    {
        // Supprime le token de l'utilisateur connecté qui a fait la requête
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.'
        ]);
    }
}
