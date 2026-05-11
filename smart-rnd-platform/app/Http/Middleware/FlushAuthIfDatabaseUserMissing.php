<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * After switching databases (SQLite vs Postgres), the session may reference a missing user row.
 * Resolving `$request->user()` would crash Inertia middleware — log out cleanly instead.
 */
class FlushAuthIfDatabaseUserMissing
{
    public function handle(Request $request, Closure $next): Response
    {
        $guard = Auth::guard('web');
        if (! $guard->check()) {
            return $next($request);
        }

        try {
            $guard->user()->getKey();

            return $next($request);
        } catch (QueryException) {
            $guard->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            $msg = 'تم تسجيل خروجك تلقائياً؛ الجلسة كانت لمستخدم غير موجود في القاعدة الحالية (يحدث بعد التبديل لـ SQLite المحلي). سجّل الدخول من جديد.';

            return redirect()->route('login')->with('error', $msg);
        }
    }
}
