<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * GET /api/users
     * Liste tous les utilisateurs.
     */
    public function index(): JsonResponse
    {
        $users = User::all()->map(function ($user) {
            return $this->formatUser($user);
        });

        return response()->json($users);
    }

    /**
     * GET /api/users/{id}
     * Détails d'un utilisateur.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        return response()->json($this->formatUser($user));
    }

    /**
     * POST /api/users
     * Créer un nouvel utilisateur.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'       => 'required|string|max:255',
            'prenom'    => 'required|string|max:255',
            'telephone' => 'required|string|max:20',
            'email'     => 'required|email|unique:users,email|max:255',
            'password'  => 'required|string|min:8',
            'role'      => 'sometimes|in:admin,client',
        ]);

        $user = User::create([
            'nom'       => $validated['nom'],
            'prenom'    => $validated['prenom'],
            'telephone' => $validated['telephone'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => $validated['role'] ?? 'client',
        ]);

        return response()->json($this->formatUser($user), 201);
    }

    /**
     * PUT /api/users/{id}
     * Modifier un utilisateur.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        $validated = $request->validate([
            'nom'       => 'sometimes|string|max:255',
            'prenom'    => 'sometimes|string|max:255',
            'telephone' => 'sometimes|string|max:20',
            'email'     => 'sometimes|email|unique:users,email,'.$id.'|max:255',
            'password'  => 'sometimes|string|min:8',
            'role'      => 'sometimes|in:admin,client',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($this->formatUser($user));
    }

    /**
     * DELETE /api/users/{id}
     * Supprimer un utilisateur.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }

    /**
     * PUT /api/users/{id}/role
     * Promouvoir ou rétrograder un utilisateur (admin / client).
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        // Empêcher de modifier le rôle du super admin (admin@gmail.com)
        if ($user->email === 'admin@gmail.com') {
            return response()->json(['message' => 'Le rôle du super administrateur ne peut pas être modifié.'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,client',
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json(['user' => $this->formatUser($user)]);
    }

    /**
     * GET /api/me
     * Récupérer l'utilisateur connecté (via le token Bearer).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->resolveUserFromRequest($request);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        return response()->json($this->formatUser($user));
    }

    /**
     * PUT /api/me
     * Mettre à jour les informations de l'utilisateur connecté.
     */
    public function updateMe(Request $request): JsonResponse
    {
        $user = $this->resolveUserFromRequest($request);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $validated = $request->validate([
            'nom'       => 'sometimes|string|max:255',
            'prenom'    => 'sometimes|string|max:255',
            'telephone' => 'sometimes|string|max:20',
            'email'     => 'sometimes|email|unique:users,email,'.$user->id.'|max:255',
        ]);

        $user->update($validated);

        return response()->json(['user' => $this->formatUser($user)]);
    }

    /**
     * PUT /api/me/password
     * Changer le mot de passe de l'utilisateur connecté.
     */
    public function updateMePassword(Request $request): JsonResponse
    {
        $user = $this->resolveUserFromRequest($request);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $validated = $request->validate([
            'current_password'             => 'required|string',
            'new_password'                 => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Le mot de passe actuel est incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($validated['new_password'])]);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    /**
     * Résout l'utilisateur connecté depuis le header Authorization Bearer.
     * Accepte soit un token opaque (identifiant ou email), soit un format {id}.
     */
    private function resolveUserFromRequest(Request $request): ?User
    {
        $header = $request->header('Authorization', '');
        $token  = preg_replace('/^Bearer\s+/i', '', $header);

        if (! $token) {
            return null;
        }

        // Cas 1 : token = identifiant numérique (id de l'utilisateur)
        if (ctype_digit($token)) {
            return User::find((int) $token);
        }

        // Cas 2 : token = email (fallback utilisé par le client admin)
        if (filter_var($token, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $token)->first();
        }

        // Cas 3 : token opaque non reconnu → on tente de trouver par email exact
        return User::where('email', $token)->first();
    }

    /**
     * GET /api/health
     * Health check du service.
     */
    public function health(): JsonResponse
    {
        $dbOk = false;
        try {
            User::query()->count();
            $dbOk = true;
        } catch (\Throwable $e) {
            // Database not reachable
        }

        return response()->json([
            'service'  => 'user-service',
            'framework' => 'Laravel 11 + MySQL',
            'database'  => $dbOk ? 'connected' : 'disconnected',
            'status'    => 'UP 🟢',
        ]);
    }

    /**
     * Formate un utilisateur pour la réponse JSON (masque les champs sensibles).
     */
    private function formatUser(User $user): array
    {
        return [
            'id'             => $user->id,
            'nom'            => $user->nom,
            'prenom'         => $user->prenom,
            'telephone'      => $user->telephone,
            'email'          => $user->email,
            'role'           => $user->role ?? 'client',
            'photo'          => $user->photo,
            'email_verified' => ! is_null($user->email_verified_at),
            'created_at'     => $user->created_at?->toISOString(),
            'updated_at'     => $user->updated_at?->toISOString(),
        ];
    }
}
