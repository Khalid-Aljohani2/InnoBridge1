<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $isInertia = $request->headers->has('X-Inertia');
        $expectsJsonApi = $request->expectsJson() && ! $isInertia;

        if (! $user) {
            if ($expectsJsonApi) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated',
                ], 401);
            }

            return redirect()->route('login');
        }

        if (! in_array($user->role, $roles, true)) {
            if ($expectsJsonApi) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden: insufficient role permissions',
                ], 403);
            }

            return redirect()->route('dashboard')->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        return $next($request);
    }
}
