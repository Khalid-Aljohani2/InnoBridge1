import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function HodIndustryChallenges({ pendingCompanyChallenges = [], awaitingPublicationChallenges = [] }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [industryNotesById, setIndustryNotesById] = useState({});

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'مراجعة تحديات الصناعة',
                      desc: 'اقبل أو ارفض طلب الشركة أولاً. بعد القبول، اضغط «عرض للطلاب» عند الجاهزية — حتى ذلك الحين لا يظهر التحدي في قائمة الطلاب.',
                      pendingTitle: 'بانتظار قرارك (قبول / رفض)',
                      awaitingTitle: 'مقبولة — بانتظار العرض للطلاب',
                      company: 'جهة الصناعة',
                      approveChallenge: 'قبول الطلب',
                      rejectChallenge: 'رفض الطلب',
                      publishToStudents: 'عرض للطلاب',
                      notes: 'ملاحظات (اختياري)',
                      emptyPending: 'لا توجد طلبات بانتظار القرار.',
                      emptyAwaiting: 'لا توجد تحديات مقبولة بانتظار العرض للطلاب.',
                  }
                : {
                      title: 'Industry challenge review',
                      desc: 'Accept or reject the company submission first. After acceptance, click “Show to students” when ready — until then students will not see the challenge.',
                      pendingTitle: 'Awaiting your decision (accept / reject)',
                      awaitingTitle: 'Accepted — awaiting publication to students',
                      company: 'Posted by',
                      approveChallenge: 'Accept request',
                      rejectChallenge: 'Reject request',
                      publishToStudents: 'Show to students',
                      notes: 'Notes (optional)',
                      emptyPending: 'Nothing is waiting for your decision.',
                      emptyAwaiting: 'No accepted challenges are waiting to be shown to students.',
                  },
        [isArabic],
    );

    const industryPoster = (c) => c?.posted_by ?? c?.postedBy;

    const reviewIndustryChallenge = (challengeId, decision) => {
        router.patch(
            route('hod.industry-challenges.review', challengeId),
            { decision, notes: industryNotesById[challengeId] || null },
            { preserveScroll: true },
        );
    };

    const publishChallenge = (challengeId) => {
        router.patch(route('hod.industry-challenges.publish', challengeId), {}, { preserveScroll: true });
    };

    const cardList = (items, variant) =>
        items.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{variant === 'pending' ? t.emptyPending : t.emptyAwaiting}</p>
        ) : (
            <div className="space-y-3">
                {items.map((c) => (
                    <div
                        key={c.id}
                        className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className={`font-black text-lg leading-tight ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{c.title}</p>
                                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    <span className="font-semibold">{t.company}</span>: {industryPoster(c)?.name || '—'}
                                    {industryPoster(c)?.email ? ` (${industryPoster(c).email})` : ''}
                                </p>
                                {c.deadline ? (
                                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                        {isArabic ? 'الموعد النهائي' : 'Deadline'}: {c.deadline}
                                    </p>
                                ) : null}
                                <p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{c.description}</p>
                            </div>
                            <div className="flex w-full min-w-[260px] max-w-lg flex-col gap-2">
                                {variant === 'pending' ? (
                                    <>
                                        <textarea
                                            value={industryNotesById[c.id] || ''}
                                            onChange={(e) => setIndustryNotesById((p) => ({ ...p, [c.id]: e.target.value }))}
                                            rows={2}
                                            placeholder={t.notes}
                                            className={`w-full rounded-xl text-sm ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => reviewIndustryChallenge(c.id, 'approve')}
                                                className="sr-btn-action bg-green-600 text-white hover:bg-green-700 w-auto px-4 text-xs"
                                            >
                                                {t.approveChallenge}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => reviewIndustryChallenge(c.id, 'reject')}
                                                className="sr-btn-action-danger w-auto px-4 text-xs"
                                            >
                                                {t.rejectChallenge}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => publishChallenge(c.id)}
                                        className="sr-btn-action bg-blue-600 text-white hover:bg-blue-700 w-auto px-4 text-xs"
                                    >
                                        {t.publishToStudents}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.desc}</p>
                </div>
            }
        >
            <Head title={t.title} />
            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack space-y-4">
                    {flash?.success && (
                        <div className="sr-alert-success">{flash.success}</div>
                    )}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.pendingTitle}</h3>
                        <div className="mt-4">{cardList(pendingCompanyChallenges, 'pending')}</div>
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.awaitingTitle}</h3>
                        <div className="mt-4">{cardList(awaitingPublicationChallenges, 'awaiting')}</div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
