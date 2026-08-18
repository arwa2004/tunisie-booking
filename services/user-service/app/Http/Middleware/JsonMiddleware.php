<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force toutes les réponses du microservice en JSON.
 * Utile pour un backend API pur derrière le gateway Nginx.
 */
class JsonMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Type', 'application/json; charset=UTF-8');

        return $response;
    }
}
