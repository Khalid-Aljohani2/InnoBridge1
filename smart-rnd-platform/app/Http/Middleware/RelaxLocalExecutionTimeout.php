<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Slow remote DB round-trips (e.g. cross-region Postgres) can exceed PHP's default 60s budget
 * before controller-level set_time_limit() runs — especially under heavy global middleware work.
 */
class RelaxLocalExecutionTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local')) {
            @ini_set('max_execution_time', '300');
            if (function_exists('set_time_limit')) {
                @set_time_limit(300);
            }
        }

        return $next($request);
    }
}
