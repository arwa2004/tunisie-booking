<?php

use Illuminate\Support\Facades\Route;

// Route web d'accueil — ne PAS utiliser '/' (réservé à l'API des users via gateway)
Route::get('/welcome', function () {
    return [
        'service'   => 'user-service',
        'framework' => 'Laravel ' . app()->version() . ' + MySQL',
        'message'   => 'User Microservice API — utilisez /api/users ou /api/health via le gateway.',
    ];
});
