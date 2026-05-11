import { getApiBaseUrl } from '@/config/env';

/**
 * Netlify (and the Vite preview host) only ship this small SPA. Routes like `/login` and
 * `/dashboard` are served by Laravel + Inertia on the API host. Without a client router here,
 * `/login` would keep showing the probe page — redirect to Laravel with the same path.
 */
export function redirectSpaRoutesToLaravelApp(): void {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    if (path === '/' || path === '') return;

    if (
        /^\/(?:assets\/|vite\.svg|favicon\.svg|favicon\.ico|robots\.txt)/.test(path) ||
        path.startsWith('/@') ||
        path.startsWith('/src/')
    ) {
        return;
    }

    const laravelOrigin = getApiBaseUrl();
    if (!laravelOrigin) return;

    const target =
        laravelOrigin.replace(/\/$/, '') + path + window.location.search + window.location.hash;
    window.location.replace(target);
}
