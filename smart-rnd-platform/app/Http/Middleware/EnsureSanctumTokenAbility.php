<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Requires the current Sanctum personal access token to include at least one of the pipe-separated abilities (or *).
 */
class EnsureSanctumTokenAbility
{
    public function handle(Request $request, Closure $next, string $abilityList): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if (! $token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Token-scoped abilities required for this endpoint.',
            ], 403);
        }

        $granted = $token->abilities ?? [];

        if (in_array('*', $granted, true)) {
            return $next($request);
        }

        $required = array_filter(explode(';', $abilityList));

        foreach ($required as $ability) {
            if (in_array($ability, $granted, true)) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Forbidden: token missing required ability.',
        ], 403);
    }
}
