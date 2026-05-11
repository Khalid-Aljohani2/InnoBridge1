import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function ChallengeRequests({ requests = [] }) {
    const { flash, auth } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [notesById, setNotesById] = useState({});

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'طلبات التحديات (بانتظار قرار المشرف)',
                      desc: 'راجع الطلبات المقدمة من مجموعاتك واعتمد أو ارفض مع ملاحظات.',
                      empty: 'لا توجد طلبات حالياً.',
                      group: 'المجموعة',
                      requestedBy: 'مقدم الطلب',
                      company: 'الشركة',
                      deadline: 'الحد النهائي',
                      approve: 'اعتماد',
                      reject: 'رفض',
                      notes: 'ملاحظات (اختياري)',
                  }
                : {
                      title: 'Pending Challenge Requests',
                      desc: 'Review your groups requests and approve or reject with notes.',
                      empty: 'No pending requests.',
                      group: 'Group',
                      requestedBy: 'Requested by',
                      company: 'Company',
                      deadline: 'Deadline',
                      approve: 'Approve',
                      reject: 'Reject',
                      notes: 'Notes (optional)',
                  },
        [isArabic],
    );

    const decide = (reqId, decision) => {
        router.patch(
            route('supervisor.challenge-requests.decide', reqId),
            { decision, notes: notesById[reqId] || null },
            { preserveScroll: true },
        );
    };

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
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && (
                        <div className="sr-alert-success">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="sr-alert-error">{flash.error}</div>
                    )}

                    {requests.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>
                            {t.empty}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((r) => (
                                <div key={r.id} className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                {r.industry_challenge?.title || r.industryChallenge?.title || '-'}
                                            </h3>
                                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                                {r.industry_challenge?.description || r.industryChallenge?.description || ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => decide(r.id, 'approve')} className="sr-btn-industry-gradient w-auto px-4 text-xs disabled:opacity-60">
                                                {t.approve}
                                            </button>
                                            <button onClick={() => decide(r.id, 'reject')} className="sr-btn-action-danger w-auto px-4 text-xs rounded-[15px]">
                                                {t.reject}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                        <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                            <p className="text-gray-500">{t.group}</p>
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{r.team?.name || '-'}</p>
                                        </div>
                                        <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                            <p className="text-gray-500">{t.requestedBy}</p>
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{r.requested_by_student?.name || r.requestedByStudent?.name || '-'}</p>
                                        </div>
                                        <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                            <p className="text-gray-500">{t.company}</p>
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{(r.industry_challenge?.posted_by?.name || r.industryChallenge?.postedBy?.name) ?? '-'}</p>
                                        </div>
                                        <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                            <p className="text-gray-500">{t.deadline}</p>
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{r.industry_challenge?.deadline || r.industryChallenge?.deadline || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.notes}</label>
                                        <textarea
                                            value={notesById[r.id] || ''}
                                            onChange={(e) => setNotesById((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                            rows={3}
                                            className={`mt-1 w-full rounded-xl text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

