import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function IndustryPortal({ challenges = [], requests = [] }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        deadline: '',
    });
    const [companyNotesById, setCompanyNotesById] = useState({});

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'التحديات',
                      desc: 'يُعرض الطلب بعد موافقة المشرف على رئيس القسم أولاً ليختار ما يُرسَل للشركة. لا ترى الشركة سوى الفرق التي تم ترشيحها. عند قبول الشركة يُعتمد مشروع الفريق؛ وعند الرفض يعود التحدي متاحاً للجميع بعد إخطاركم.',
                      create: 'إضافة تحدي جديد',
                      titleLabel: 'العنوان',
                      descLabel: 'الوصف',
                      deadline: 'الحد النهائي (اختياري)',
                      submit: 'إرسال',
                      submitting: 'جاري الإرسال...',
                      myChallenges: 'تحدياتي',
                      requests: 'الفرق المرشّحة إليكم (من رئيس القسم)',
                      accept: 'قبول الفريق لمشروع التحدي',
                      reject: 'رفض الطلب',
                      notes: 'ملاحظات (اختياري)',
                      status: 'الحالة',
                      emptyReq: 'لا توجد طلبات بعد.',
                      finalizedNotice: 'تم إغلاق هذا المسار (اعتماد نهائي أو رفض).',
                      hodPendingNotice: 'هذا الطلب أمام طرف آخر؛ لا يمكن التصرف الآن.',
                      acceptedNotice: 'تم قبول هذا الفريق وفق مسار الشركة.',
                      team: 'اسم الفريق',
                      supervisor: 'مشرف المجموعة',
                  }
                : {
                      title: 'Challenges',
                      desc: 'The HoD forwards only shortlisted teams here. Accept to assign the industry project or reject—the challenge stays open for competition.',
                      create: 'Create new challenge',
                      titleLabel: 'Title',
                      descLabel: 'Description',
                      deadline: 'Deadline (optional)',
                      submit: 'Submit',
                      submitting: 'Submitting...',
                      myChallenges: 'My challenges',
                      requests: 'HoD-nominated teams',
                      accept: 'Accept team for challenge',
                      reject: 'Reject this application',
                      notes: 'Notes (optional)',
                      status: 'Status',
                      emptyReq: 'No requests yet.',
                      finalizedNotice: 'This workflow row is finalized.',
                      hodPendingNotice: 'Not actionable in current step.',
                      acceptedNotice: 'This team was accepted for the challenge.',
                      team: 'Team',
                      supervisor: 'Supervisor',
                  },
        [isArabic],
    );

    const csLabel = useMemo(() => {
        const ar = {
            waiting_supervisor: 'بانتظار المشرف',
            awaiting_hod_nomination: 'بانتظار ترشيح رئيس القسم',
            nominated_to_company: 'مرشح للشركة',
            accepted_by_company: 'مقبول من الشركة',
            rejected_by_company: 'مرفوض من الشركة',
            finalized_lost: 'مغلق / غير مرشَّح أو فريق آخر فاز',
            awaiting_company: 'قديم — بانتظار الشركة',
            hod_nomination_pending: 'قديم — خطوات سابقة',
            finalized_won: 'قديم — مكتمل',
            pending: 'قيد المراجعة',
            accepted: 'قديم — مقبول',
            rejected: 'مرفوض',
        };
        const en = {
            waiting_supervisor: 'Awaiting supervisor',
            awaiting_hod_nomination: 'Awaiting HoD nomination',
            nominated_to_company: 'Nominated to company',
            accepted_by_company: 'Accepted by company',
            rejected_by_company: 'Rejected by company',
            finalized_lost: 'Closed — not shortlisted or superseded',
            awaiting_company: 'Legacy — awaiting company',
            hod_nomination_pending: 'Legacy — pending step',
            finalized_won: 'Legacy — finalized',
            pending: 'Pending',
            accepted: 'Legacy accepted',
            rejected: 'Rejected',
        };
        return (code) => (isArabic ? ar[code] : en[code]) || code || '—';
    }, [isArabic]);

    const chip = (status) => {
        if (status === 'accepted_by_company' || status === 'finalized_won') return 'sr-chip-emerald';
        if (status === 'rejected_by_company' || status === 'finalized_lost') return 'sr-chip-red';
        if (status === 'nominated_to_company') return 'sr-chip-emerald';
        if (status === 'awaiting_hod_nomination') return 'sr-chip-amber';
        return 'sr-chip-amber';
    };

    const challengeReviewChip = (c) => {
        const status = c?.review_status;
        if (status === 'rejected') return 'sr-chip-red';
        if (status === 'pending_action') return 'sr-chip-amber';
        if (status === 'approved' && !c?.published_to_students_at) return 'sr-chip-amber';
        if (status === 'approved') return 'sr-chip-emerald';
        return 'sr-chip-amber';
    };

    const challengeReviewLabel = (c) => {
        const status = c?.review_status;
        if (status === 'approved' && c?.published_to_students_at)
            return isArabic ? 'معتمد — يظهر للطلاب' : 'Approved — visible to students';
        if (status === 'approved') return isArabic ? 'معتمد — بانتظار العرض للطلاب' : 'Approved — awaiting HoD publication';
        if (status === 'rejected') return isArabic ? 'مرفوض من رئيس القسم' : 'Rejected by HoD';
        if (status === 'pending_action') return isArabic ? 'بانتظار اعتماد رئيس القسم' : 'Pending HoD approval';
        return status || '—';
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('industry.challenges.store'), {
            onSuccess: () => reset(),
        });
    };

    const decide = (reqId, decision) => {
        router.patch(
            route('industry.challenge-requests.decide', reqId),
            { decision, notes: companyNotesById[reqId] || null },
            { preserveScroll: true },
        );
    };

    const shellBg = `industry-dark-shell min-h-screen py-8 ${isDark ? 'bg-gradient-to-br from-slate-950 via-emerald-950/25 to-teal-950/45' : 'sr-app-bg'}`;

    const panelCard = isDark
        ? 'custom-card border border-emerald-500/25 bg-slate-900/85 p-6'
        : 'sr-card-light border border-emerald-100 p-6 shadow-sm';

    const fieldCn = isDark
        ? 'mt-1 w-full focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/25'
        : 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

    const listRow = isDark
        ? 'rounded-[16px] border border-slate-700/70 bg-slate-800/70 p-4 shadow-inner'
        : 'rounded-[16px] border border-gray-200 bg-gray-50/90 p-4 shadow-sm';

    const requestCard = isDark
        ? 'rounded-[16px] border border-slate-700/70 bg-slate-800/80 p-5 shadow-[0_8px_32px_-20px_rgba(0,0,0,0.7)]'
        : 'rounded-[16px] border border-gray-200 bg-white p-5 shadow-sm';

    const labelCn = isDark ? 'text-xs font-bold text-slate-200' : 'text-xs font-bold text-gray-700';
    const errCn = isDark ? 'mt-1 text-xs text-red-400' : 'mt-1 text-xs text-red-600';

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
            <div dir={isArabic ? 'rtl' : 'ltr'} className={shellBg}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && <div className="sr-alert-success">{flash.success}</div>}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    <div className={panelCard}>
                        <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.create}</h3>
                        <form onSubmit={submit} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <div className="lg:col-span-1">
                                <label className={labelCn}>{t.titleLabel}</label>
                                <input value={data.title} onChange={(e) => setData('title', e.target.value)} className={fieldCn} />
                                {errors.title && <p className={errCn}>{errors.title}</p>}
                            </div>
                            <div className="lg:col-span-1">
                                <label className={labelCn}>{t.deadline}</label>
                                <input type="date" value={data.deadline} onChange={(e) => setData('deadline', e.target.value)} className={fieldCn} />
                            </div>
                            <div className="lg:col-span-3">
                                <label className={labelCn}>{t.descLabel}</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} className={fieldCn} />
                                {errors.description && <p className={errCn}>{errors.description}</p>}
                            </div>
                            <div className="lg:col-span-3">
                                <button disabled={processing} className="btn-gradient w-auto px-5 disabled:opacity-60">
                                    {processing ? t.submitting : t.submit}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className={panelCard}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.myChallenges}</h3>
                            <div className="space-y-3">
                                {challenges.map((c) => (
                                    <div key={c.id} className={listRow}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{c.title}</p>
                                            <span className={challengeReviewChip(c)}>{challengeReviewLabel(c)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={panelCard}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.requests}</h3>
                            {requests.length === 0 ? (
                                <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>{t.emptyReq}</p>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((r) => (
                                        <div key={r.id} className={requestCard}>
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <p className={`text-base font-black ${isDark ? 'text-slate-50' : 'text-gray-900'}`}>
                                                        {r.industry_challenge?.title || r.industryChallenge?.title}
                                                    </p>
                                                    <p className={`mt-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        {t.team}
                                                    </p>
                                                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{r.team?.name}</p>
                                                    <p className={`mt-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        {t.supervisor}
                                                    </p>
                                                    <p className={`font-bold ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>{r.team?.supervisor?.name ?? '—'}</p>
                                                </div>
                                                <span className={chip(r.company_status)}>{csLabel(r.company_status)}</span>
                                            </div>

                                            {r.company_status === 'nominated_to_company' ? (
                                                <>
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => decide(r.id, 'accept')} className="btn-gradient w-auto px-4 text-xs">
                                                            {t.accept}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => decide(r.id, 'reject')}
                                                            className="sr-btn-action-danger w-auto rounded-[15px] px-4 text-xs"
                                                        >
                                                            {t.reject}
                                                        </button>
                                                    </div>
                                                    <div className="mt-3">
                                                        <label className={labelCn}>{t.notes}</label>
                                                        <textarea
                                                            value={companyNotesById[r.id] || ''}
                                                            onChange={(e) => setCompanyNotesById((p) => ({ ...p, [r.id]: e.target.value }))}
                                                            rows={2}
                                                            className={`${fieldCn} mt-1`}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <p className={`mt-4 text-sm leading-relaxed ${isDark ? 'text-emerald-100/90' : 'text-gray-700'}`}>
                                                    {['accepted_by_company', 'finalized_won'].includes(String(r.company_status))
                                                        ? t.acceptedNotice
                                                        : ['rejected_by_company', 'finalized_lost'].includes(String(r.company_status))
                                                          ? r.company_notes || t.finalizedNotice
                                                          : t.finalizedNotice}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
