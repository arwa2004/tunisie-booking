<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    /**
     * Gère l'authentification sociale reçue depuis NextAuth.js
     */
    public function handleSocialLogin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'provider' => 'required|string',
            'provider_id' => 'required|string',
        ]);

        // Recherche l'utilisateur par son email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Crée l'utilisateur si absent
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'telephone' => 'N/A',
                'password' => Hash::make(Str::random(24)), // Mot de passe aléatoire sécurisé
                'role' => 'client',
            ]);
        }

        // Génère le token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }
}
