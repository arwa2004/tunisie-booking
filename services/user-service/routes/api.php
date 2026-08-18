<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| User Service — API Routes (derrière l'API Gateway Nginx)
|--------------------------------------------------------------------------
|
| Contrat de routage avec le gateway Nginx :
|   location /api/users  →  rewrite ^/api/users/?(.*)$  →  /
|
|   GET    /api/users        →  GET  /            (liste)
|   POST   /api/users        →  POST /            (création)
|   GET    /api/users/{id}   →  GET  /{id}        (détail)
|   PUT    /api/users/{id}   →  PUT  /{id}        (mise à jour)
|   DELETE /api/users/{id}   →  DELETE /{id}      (suppression)
|   GET    /api/health       →  GET  /health      (health check)
|
*/

Route::get('/', [UserController::class, 'index']);       // Liste tous les utilisateurs
Route::get('health', [UserController::class, 'health']); // Health check

// Routes "me" (profil de l'utilisateur connecté) — à définir AVANT le catch-all {id}
Route::get('me', [UserController::class, 'me']);                    // Profil de l'utilisateur connecté
Route::put('me', [UserController::class, 'updateMe']);              // Modifier son profil
Route::put('me/password', [UserController::class, 'updateMePassword']); // Changer son mot de passe

Route::get('{id}', [UserController::class, 'show']);     // Détails d'un utilisateur
Route::post('/', [UserController::class, 'store']);      // Créer un utilisateur
Route::put('{id}', [UserController::class, 'update']);   // Modifier un utilisateur
Route::put('{id}/role', [UserController::class, 'updateRole']); // Modifier le rôle d'un utilisateur
Route::delete('{id}', [UserController::class, 'destroy']); // Supprimer un utilisateur
