import { useEffect, useState } from 'react';

import { getApiBaseUrl, getOptionalSupabaseEnv } from '@/config/env';
import { probeLaravelPublicApi, probeSupabaseConnectivity } from '@/services';

type ProbeLine = { title: string; detail: string; severity: 'ok' | 'warn' | 'err' };

/**
 * SPA shell — all remote access goes through `@/services` layer (never axios/supabase directly here).
 */
function App() {
    const [lines, setLines] = useState<ProbeLine[]>([{ title: 'التشغيل…', detail: '', severity: 'warn' }]);

    useEffect(() => {
        let cancelled = false;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'browser';

        (async () => {
            const [laravel, supa] = await Promise.all([
                probeLaravelPublicApi(origin),
                probeSupabaseConnectivity(),
            ]);

            if (cancelled) return;

            const next: ProbeLine[] = [];

            if (laravel.ok) {
                next.push({
                    title: 'اتصال Laravel API',
                    detail: `${laravel.statusNote} — عدد تحديات (عيّنة): ${laravel.challengesCount}`,
                    severity: 'ok',
                });
            } else {
                next.push({
                    title: 'اتصال Laravel API',
                    detail: `${laravel.summary} ${laravel.detail ?? ''}`.trim(),
                    severity: 'err',
                });
            }

            if (supa.ok) {
                next.push({
                    title: 'Supabase (اتصال أولي)',
                    detail: supa.summary,
                    severity: 'ok',
                });
            } else {
                next.push({
                    title: 'Supabase',
                    detail: `${supa.summary}${supa.detail ? ` — ${supa.detail}` : ''}`,
                    severity: 'warn',
                });
            }

            setLines(next);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main style={{ fontFamily: 'system-ui,sans-serif', maxWidth: 640, margin: '3rem auto', padding: '0 1rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>InnoBridge — واجهة SPA منفصلة</h1>

            <p style={{ marginTop: '0.25rem', marginBottom: '1rem' }}>
                <a
                    href={`${getApiBaseUrl()}/login`}
                    style={{
                        display: 'inline-block',
                        background: '#0284c7',
                        color: '#fff',
                        padding: '12px 22px',
                        borderRadius: 10,
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(2,132,199,0.35)',
                    }}
                >
                    فتح التطبيق الكامل (تسجيل الدخول على الخادم)
                </a>
            </p>

            {import.meta.env.PROD &&
            (getApiBaseUrl().includes('127.0.0.1') || getApiBaseUrl().includes('localhost')) ? (
                <p
                    style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        marginBottom: '1rem',
                    }}
                >
                    <strong>إعدادات الإنتاج:</strong> هذا البناء لا يزال يوجّه الطلبات إلى عنوان تطوير محلي. في Netlify
                    عرّف <code>VITE_API_BASE_URL</code> بعنوان Render (مثل <code>https://…onrender.com</code>) ثم
                    <strong> أعد نشر الموقع</strong> (Rebuild). المتغيرات التي تبدأ بـ <code>VITE_</code> تُدمج وقت
                    البناء وليس وقت التشغيل.
                </p>
            ) : null}

            <p style={{ color: '#0f172a', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
                <strong>ليست «واجهات مفقودة»:</strong> ما تراه على Netlify هو صفحة اختبار فقط. القوائم واللوحات الحقيقية تفتح من
                الرابط أعلاه (Render / Laravel). لا تكتب عنوان Netlify ومعه عنوان كامل بدون مسافة؛ حتى لا يظهر عنوان مكسور
                مثل <code style={{ fontSize: '0.8rem' }}>…netlify.apphttps://…</code>.
                <span style={{ display: 'block', marginTop: '0.75rem' }}>
                    <a
                        href={`${getApiBaseUrl()}/login`}
                        style={{
                            marginInlineEnd: 12,
                            color: '#0369a1',
                            fontWeight: 700,
                            wordBreak: 'break-all',
                        }}
                    >
                        فتح الدخول على الخادم
                    </a>
                    <span style={{ color: '#64748b' }}> — </span>
                    <a
                        href={`${getApiBaseUrl()}/dashboard`}
                        style={{
                            marginInlineStart: 4,
                            color: '#0369a1',
                            fontWeight: 700,
                            wordBreak: 'break-all',
                        }}
                    >
                        فتح لوحة التحكم على الخادم
                    </a>
                </span>
            </p>

            <p style={{ color: '#444', marginTop: 0 }}>
                عنوان API الخلفي: <code>{getApiBaseUrl()}</code>
                <br />
                Supabase URL:{' '}
                <code>{getOptionalSupabaseEnv()?.url ?? '(لم يُضبط — اختياري لهذه الشاشة)'}</code>
            </p>

            <ul style={{ paddingInlineStart: '1rem', marginTop: '1.5rem' }}>
                {lines.map((ln) => (
                    <li key={`${ln.title}-${ln.severity}`} style={{ marginBottom: '1rem', color: ln.severity === 'err' ? '#b91c1c' : ln.severity === 'warn' ? '#92400e' : '#14532d' }}>
                        <strong>{ln.title}</strong>
                        <div style={{ fontSize: '0.92rem', marginTop: '0.25rem' }}>{ln.detail}</div>
                    </li>
                ))}
            </ul>

            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                المصدر الصحيح لتعديل الطلبات: مجلد <code>src/services</code>. لا تضع اتصالات شبكة داخل المكوّنات.
            </p>
        </main>
    );
}

export default App;
