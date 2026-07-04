<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DestinationController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoyageController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PasswordResetController;

/*
|--------------------------------------------------------------------------
| Routes publiques
|--------------------------------------------------------------------------
*/


Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:3,1'); // 3 tentatives / minute

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 tentatives / minute

Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:3,1');

Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware('throttle:3,1');

Route::get('/destinations', [DestinationController::class, 'index']);
Route::get('/destinations/{destination}', [DestinationController::class, 'show']);

Route::get('/hotels', [HotelController::class, 'index']);
Route::get('/hotels/{hotel}', [HotelController::class, 'show']);

Route::get('/voyages', [VoyageController::class, 'index']);
Route::get('/voyages/{voyage}', [VoyageController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Routes authentifiées (n'importe quel utilisateur connecté)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword']);
    Route::post('/me/photo', [AuthController::class, 'updatePhoto']); // <-- AJOUTER CETTE LIGNE

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/mes-reservations', [ReservationController::class, 'mesReservations']);
});

/*
|--------------------------------------------------------------------------
| Routes admin uniquement
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // Destinations (index/show déjà publics au-dessus)
    Route::post('/destinations', [DestinationController::class, 'store']);
    Route::post('/destinations/{destination}', [DestinationController::class, 'update']); // POST + _method=PUT si upload fichier
    Route::delete('/destinations/{destination}', [DestinationController::class, 'destroy']);

    // Hotels
    Route::post('/hotels', [HotelController::class, 'store']);
    Route::post('/hotels/{hotel}', [HotelController::class, 'update']);
    Route::delete('/hotels/{hotel}', [HotelController::class, 'destroy']);

    // Voyages
    Route::post('/voyages', [VoyageController::class, 'store']);
    Route::post('/voyages/{voyage}', [VoyageController::class, 'update']);
    Route::delete('/voyages/{voyage}', [VoyageController::class, 'destroy']);

    // Reservations (gestion admin)
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
});
