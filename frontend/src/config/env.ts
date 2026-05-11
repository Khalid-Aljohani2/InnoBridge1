/**
 * Central accessors for environment (Vite exposes only variables prefixed with VITE_).
 * Never read process.env directly in components — import from here via services layer.
 */

const trim = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : '';

/**
 * Laravel API origin (Sanctum / REST). Trailing slashes removed for axios baseURL safety.
 */
export function getApiBaseUrl(): string {
    let configured = trim(import.meta.env.VITE_API_BASE_URL);
    if (configured) {
        configured = configured.replace(/\/+$/, '');
        // Services use paths like `/api/...`; if env mistakenly ends with `/api`, strip it once.
        if (/\/api$/i.test(configured)) {
            configured = configured.replace(/\/api$/i, '');
        }
        return configured;
    }
    return 'http://127.0.0.1:8000';
}

export type SupabaseEnv = Readonly<{ url: string; anonKey: string }>;

/**
 * Anonymous key is safe for browsers when RLS protects tables; never expose service-role keys.
 */
export function getOptionalSupabaseEnv(): SupabaseEnv | null {
    const url = trim(import.meta.env.VITE_SUPABASE_URL);
    const anonKey = trim(import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!url || !anonKey) return null;
    return { url: url.replace(/\/$/, ''), anonKey };
}

/**
 * Cross-origin cookie/CSRF (Sanctum SPA) needs `true` and matching CORS origins.
 * Bearer-token API calls usually work with `false`, which avoids stricter CORS.
 */
export function getApiWithCredentials(): boolean {
    return trim(import.meta.env.VITE_API_WITH_CREDENTIALS) === 'true';
}
