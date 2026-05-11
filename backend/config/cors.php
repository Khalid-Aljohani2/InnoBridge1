<?php

/**
 * CORS for decoupled SPA + Laravel API.
 * When CORS_SUPPORTS_CREDENTIALS=true, browsers require explicit allowed_origins (no "*").
 */
$fromEnv = env('CORS_ALLOWED_ORIGINS');
if (is_string($fromEnv) && trim($fromEnv) !== '') {
    $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $fromEnv))));
} else {
    $allowedOrigins = array_values(array_filter(array_unique([
        rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ])));
}

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => array_values(array_filter(array_map(
        static fn (string $p) => trim($p),
        explode(',', (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', ''))
    ))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => (int) env('CORS_MAX_AGE', 0),

    'supports_credentials' => filter_var(env('CORS_SUPPORTS_CREDENTIALS', true), FILTER_VALIDATE_BOOL),

];
