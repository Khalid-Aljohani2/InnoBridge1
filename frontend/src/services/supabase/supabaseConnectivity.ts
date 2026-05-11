import { getOptionalSupabaseEnv } from '../../config/env';

export type ConnectivityResult =
    | { ok: true; summary: string }
    | { ok: false; summary: string; detail?: string };

/**
 * Lightweight health reachability for Supabase (auth edge) without scattering fetch in UI.
 */
export async function probeSupabaseConnectivity(): Promise<ConnectivityResult> {
    const cfg = getOptionalSupabaseEnv();
    if (!cfg) {
        return {
            ok: true,
            summary:
                'لم تُضبط متغيرات Supabase — هذا طبيعي: شاشات الطالب/المشرف تعمل عبر Laravel على Render، وليست عبر Supabase هنا. أضِف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY على Netlify فقط إن أردت اتصالاً مباشراً من المتصفح.',
        };
    }
    try {
        const url = `${cfg.url.replace(/\/$/, '')}/auth/v1/health`;
        const res = await fetch(url, {
            headers: { apikey: cfg.anonKey },
            method: 'GET',
        });
        if (!res.ok) {
            return {
                ok: false,
                summary: 'خدمة Supabase لم تُرجع حالة سليمة.',
                detail: `HTTP ${res.status}`,
            };
        }
        return { ok: true, summary: 'تم التحقق من اتصال Supabase (auth health).' };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
            ok: false,
            summary: 'تعذّر الوصول إلى Supabase.',
            detail: msg,
        };
    }
}
