import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function IndustryChallenges({ challenges = [] }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [q, setQ] = useState('');
    const { data, setData, post, processing } = useForm({
        industry_challenge_id: '',
    });

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'تحديات الصناعة (المعتمدة)',
                      desc: 'استكشف التحديات المعتمدة وقدّم طلب تحدي عبر مشرف مجموعتك.',
                      search: 'ابحث بعنوان التحدي...',
                      deadline: 'الحد النهائي',
                      request: 'تقديم طلب تحدي',
                      requesting: 'جاري الإرسال...',
                      empty: 'لا توجد تحديات معتمدة حالياً.',
                  }
                : {
                      title: 'Approved Industry Challenges',
                      desc: 'Browse published challenges and submit an industry challenge request for your supervisor to review.',
                      search: 'Search by title...',
                      deadline: 'Deadline',
                      request: 'Submit challenge request',
                      requesting: 'Sending...',
                      empty: 'No approved challenges available yet.',
                  },
        [isArabic],
    );

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return challenges;
        return challenges.filter((c) => String(c.title || '').toLowerCase().includes(term));
    }, [challenges, q]);

    const requestChallenge = (id) => {
        setData('industry_challenge_id', String(id));
        post(route('student.industry-challenges.request'), {
            preserveScroll: true,
        });
    };

    const searchWrap = isDark
        ? 'custom-card border border-emerald-500/25 p-4'
        : 'sr-card-light border border-emerald-100/70 p-4 shadow-sm';
    const challengeCard = isDark
        ? 'custom-card border border-emerald-500/25 p-6'
        : 'sr-card-light border border-emerald-100 p-6 shadow-sm';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>
                    <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.desc}</p>
                </div>
            }
        >
            <Head title={t.title} />

            <div
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`industry-dark-shell min-h-screen py-8 ${isDark ? 'bg-gradient-to-br from-slate-950 via-emerald-950/30 to-teal-950/50' : 'sr-app-bg'}`}
            >
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && <div className="sr-alert-success">{flash.success}</div>}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    <div className={searchWrap}>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t.search}
                            className={`w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                                isDark
                                    ? 'border-slate-600 bg-slate-950/90 text-slate-100 placeholder:text-slate-500'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
                            }`}
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className={challengeCard}>
                            <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>{t.empty}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {filtered.map((c) => (
                                <div key={c.id} className={challengeCard}>
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{c.title}</h3>
                                        <button
                                            onClick={() => requestChallenge(c.id)}
                                            disabled={processing}
                                            className="btn-gradient w-auto px-4 text-xs disabled:opacity-60"
                                        >
                                            {processing && String(data.industry_challenge_id) === String(c.id) ? t.requesting : t.request}
                                        </button>
                                    </div>
                                    <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{c.description}</p>
                                    <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                        {t.deadline}: {c.deadline || '-'}
                                    </p>
                                    {c.postedBy?.name ? (
                                        <p className={`mt-1 text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                            {isArabic ? 'الشركة:' : 'Company:'} {c.postedBy.name}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
