<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!in_array($request->user()->role, $roles)) {
            return response()->json(['message' => 'Unauthorized. Insufficient permissions.'], 403);
        }

        if ($request->user()->status === 'suspended') {
            return response()->json(['message' => 'Your account has been suspended.'], 403);
        }

        return $next($request);
    }
}
