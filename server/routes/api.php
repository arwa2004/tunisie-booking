<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DestinationController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\AuthController; // <-- Import de AuthController
use App\Http\Controllers\Api\VoyageController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\UserController;


/*
|--------------------------------------------------------------------------
| Routes Publiques (Accessibles sans connexion)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::apiResource('destinations', DestinationController::class)->only(['index', 'show']);
Route::apiResource('hotels', HotelController::class)->only(['index', 'show']);
Route::apiResource('voyages', VoyageController::class)->only(['index', 'show']);

/*
|--------------------------------------------------------------------------
| Routes Protégées (Connexion obligatoire via Jeton/Token Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Réservations
    Route::apiResource('reservations', ReservationController::class);
    Route::get('/mes-reservations', [ReservationController::class, 'mesReservations']);

    // Admin Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Admin CRUD complet
    Route::apiResource('destinations', DestinationController::class)
        ->except(['index', 'show']);
    Route::apiResource('hotels', HotelController::class)
        ->except(['index', 'show']);
    Route::apiResource('voyages', VoyageController::class)
        ->except(['index', 'show']);
});
