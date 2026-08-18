<?php

use App\Http\Middleware\JsonMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
// ── apiPrefix '' : le gateway Nginx a déjà retiré '/api/users'
//    avant de proxifier la requête vers le service (rewrite → /).
->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: '',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Force toutes les réponses API en JSON
        $middleware->append(JsonMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Réponses JSON structurées pour les erreurs de l'API
        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
