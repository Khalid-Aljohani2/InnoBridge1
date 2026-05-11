import { fetchChallenges } from '../api/challengesService';
import { normalizeAxiosError } from '../http/httpClient';

export type LaravelApiProbe =
    | { ok: true; challengesCount: number; statusNote: string }
    | { ok: false; summary: string; detail?: string };

export async function probeLaravelPublicApi(originLabel: string): Promise<LaravelApiProbe> {
    try {
        const body = await fetchChallenges();
        const list = Array.isArray(body.data) ? body.data : [];
        const statusNote = `الاتصال من أصل المتصفّح (${originLabel}) — ${typeof body.status === 'string' ? body.status : 'ok'}`;
        return { ok: true, challengesCount: list.length, statusNote };
    } catch (e) {
        const err = normalizeAxiosError(e);
        const net = `${err.message ?? ''}${err.status != null ? ` (HTTP ${err.status})` : ''}`;
        return {
            ok: false,
            summary: 'تعذّر الوصول إلى واجهة Laravel API من هذا المتصفّح.',
            detail: `${net}. تأكّد أن VITE_API_BASE_URL صحيح وأن الخادم يسمح بـ CORS لأصل الواجهة.`,
        };
    }
}
