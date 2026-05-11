import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const originalityStyles = {
    unique: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    partial: 'border-amber-300 bg-amber-50 text-amber-900',
    high_similarity: 'border-red-300 bg-red-50 text-red-900',
    unknown: 'border-slate-300 bg-slate-50 text-slate-800',
};

const resolveSimilarityPercent = (originality) => {
    const raw = originality?.similarity_score ?? originality?.similarity_percent ?? originality?.max_similarity;
    if (raw == null || Number.isNaN(Number(raw))) return null;
    const value = Number(raw);
    if (value <= 1 && value >= 0) return Math.round(value * 100);
    return Math.round(value);
};

const resolveSimilarityBand = (percent, tier) => {
    if (typeof percent === 'number') {
        if (percent > 70) return 'high_similarity';
        if (percent >= 40) return 'partial';
        return 'unique';
    }

    if (tier === 'high_match') return 'high_similarity';
    if (tier === 'similar') return 'partial';
    if (tier === 'unique') return 'unique';

    return 'unknown';
};

export default function Projects({ teams = [], plans = [] }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [planByProjectId, setPlanByProjectId] = useState({});
    const [notesBySubmissionId, setNotesBySubmissionId] = useState({});

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'مشاريع الفرق',
                      desc: 'تعيين خطة مراحل ومراجعة تسليمات الطلاب.',
                      empty: 'لا توجد مشاريع مرتبطة بفرقك بعد.',
                      team: 'الفريق',
                      leader: 'القائد',
                      plan: 'خطة المراحل',
                      selectPlan: 'اختر خطة',
                      assign: 'تعيين الخطة',
                      submissions: 'التسليمات',
                              submissionsSnapshot: 'ملخص التسليمات',
                              pendingReviewsCount: 'بانتظار المراجعة',
                              reviewedCount: 'تمت مراجعتها',
                              needsRevisionCount: 'بحاجة تعديل',
                              noSubmissionsYet: 'لا توجد أي تسليمات بعد لهذا المشروع.',
                      category: 'التصنيف',
                      unclassified: 'غير مصنّف',
                      milestone: 'المرحلة',
                      noMilestones: 'لا توجد مراحل بعد (عيّن خطة مراحل أولاً).',
                      approve: 'قبول',
                      revise: 'طلب تعديل',
                      reject: 'رفض',
                      notes: 'ملاحظات (اختياري)',
                      openFile: 'فتح الملف',
                      submitted: 'بانتظار المراجعة',
                      reviewed: 'مراجع',
                      needsRevision: 'بحاجة تعديل',
                      submissionHistory: 'سجل التسليمات',
                      noPendingReviews: 'لا توجد تسليمات بانتظار المراجعة.',
                      decidedOn: 'تاريخ القرار',
                      originalityTitle: 'تشابه الفكرة',
                      similarityLabel: 'أقصى تشابه',
                      originalityHint: 'استخدم نسبة التشابه قبل قرار القبول أو الرفض.',
                      unique: 'فريدة',
                      partial: 'متوسطة',
                      highSimilarity: 'تشابه عال',
                      unknown: 'غير محدد',
                  }
                : {
                      title: 'Team Projects',
                      desc: 'Assign a milestone plan and review student submissions.',
                      empty: 'No team projects yet.',
                      team: 'Team',
                      leader: 'Leader',
                      plan: 'Milestone plan',
                      selectPlan: 'Select plan',
                      assign: 'Assign plan',
                      submissions: 'Submissions',
                              submissionsSnapshot: 'Submissions Snapshot',
                              pendingReviewsCount: 'Pending review',
                              reviewedCount: 'Reviewed',
                              needsRevisionCount: 'Needs revision',
                              noSubmissionsYet: 'No submissions yet for this project.',
                      category: 'Category',
                      unclassified: 'Unclassified',
                      milestone: 'Milestone',
                      noMilestones: 'No milestones yet (assign a plan first).',
                      approve: 'Approve',
                      revise: 'Request revision',
                      reject: 'Reject',
                      notes: 'Notes (optional)',
                      openFile: 'Open file',
                      submitted: 'Pending review',
                      reviewed: 'Reviewed',
                      needsRevision: 'Needs revision',
                      submissionHistory: 'Submission history',
                      noPendingReviews: 'No submissions awaiting review.',
                      decidedOn: 'Decided',
                      originalityTitle: 'Idea similarity',
                      similarityLabel: 'Max similarity',
                      originalityHint: 'Review similarity before approving or rejecting.',
                      unique: 'Unique',
                      partial: 'Moderate',
                      highSimilarity: 'High similarity',
                      unknown: 'Unknown',
                  },
        [isArabic],
    );

    const assignPlan = (projectId) => {
        const planId = planByProjectId[projectId];
        if (!planId) return;
        router.patch(route('supervisor.projects.plan', projectId), { milestone_plan_id: planId }, { preserveScroll: true });
    };

    const decide = (submissionId, decision) => {
        router.patch(
            route('supervisor.submissions.decide', submissionId),
            { decision, notes: notesBySubmissionId[submissionId] || null },
            { preserveScroll: true },
        );
    };

    const submissionStatusLabel = (s) => {
        if (s === 'reviewed') return t.reviewed;
        if (s === 'needs_revision') return t.needsRevision;
        if (s === 'submitted') return t.submitted;
        return s || '-';
    };

    const latestSubmission = (m) => (m?.submissions || [])[0] || null;

    const buildHistoryRows = (milestones) => {
        const rows = (milestones || []).flatMap((m) =>
            (m.submissions || [])
                .filter((s) => s.status === 'reviewed' || s.status === 'needs_revision')
                .map((s) => ({
                    ...s,
                    milestone_title: m.title,
                })),
        );
        rows.sort((a, b) => {
            const ta = new Date(a.reviewed_at || a.updated_at || 0).getTime();
            const tb = new Date(b.reviewed_at || b.updated_at || 0).getTime();
            return tb - ta;
        });
        return rows.slice(0, 40);
    };

    const pendingMilestones = (milestones) =>
        (milestones || []).filter((m) => {
            const latest = latestSubmission(m);
            return latest && latest.status === 'submitted';
        });

    const extractOriginality = (challenge) => {
        if (!challenge?.feedbacks?.length) return null;
        for (const feedback of challenge.feedbacks) {
            const comment = String(feedback?.comment || '');
            if (!comment.startsWith('AI_REVIEW_JSON:')) continue;
            try {
                const parsed = JSON.parse(comment.replace('AI_REVIEW_JSON:', ''));
                if (parsed?.originality) return parsed.originality;
            } catch (error) {
                // ignore malformed feedback blocks
            }
        }
        return null;
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const id = window.location.hash?.replace(/^#/, '');
        if (!id) return;
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }, [teams]);

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
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    {teams.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>{t.empty}</div>
                    ) : (
                        <div className="space-y-4">
                            {teams.map((team) => {
                                const milestones = team.project?.milestones || [];
                                const historyRows = buildHistoryRows(milestones);
                                const pending = pendingMilestones(milestones);
                                const allLatest = milestones.map((m) => latestSubmission(m)).filter(Boolean);
                                const submittedCount = allLatest.filter((s) => s.status === 'submitted').length;
                                const reviewedCount = allLatest.filter((s) => s.status === 'reviewed').length;
                                const needsRevisionCount = allLatest.filter((s) => s.status === 'needs_revision').length;
                                const ideaOriginality = extractOriginality(team?.project?.industryChallenge);
                                const similarityPercent = resolveSimilarityPercent(ideaOriginality);
                                const similarityBand = resolveSimilarityBand(similarityPercent, ideaOriginality?.tier);

                                return (
                                <div key={team.id} className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.project?.title || '-'}</h3>
                                            <div className="mt-1">
                                                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                                    {t.category}: {team.project?.category || t.unclassified}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.team}: {team.name} · {t.leader}: {team.leader?.name || '-'}
                                            </p>
                                        </div>
                                        <div className="text-sm font-black text-blue-600">{team.project?.current_progress ?? 0}%</div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                                        <div className={`rounded-xl p-4 border flex flex-col ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.plan}</p>
                                            <div className="flex gap-2">
                                                <select
                                                    value={planByProjectId[team.project_id] || team.project?.milestone_plan_id || ''}
                                                    onChange={(e) => setPlanByProjectId((p) => ({ ...p, [team.project_id]: e.target.value }))}
                                                    className={`flex-1 rounded-lg text-xs ${isDark ? 'bg-slate-950 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                                >
                                                    <option value="">{t.selectPlan}</option>
                                                    {plans.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button onClick={() => assignPlan(team.project_id)} className="sr-btn-action-primary w-auto px-3 text-xs">
                                                    {t.assign}
                                                </button>
                                            </div>

                                            <div
                                                id={`supervisor-team-${team.id}-submission-history`}
                                                className={`mt-4 flex-1 min-h-0 flex flex-col border-t pt-3 scroll-mt-24 ${isDark ? 'border-slate-600/50' : 'border-gray-200'}`}
                                            >
                                                <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.submissionHistory}</p>
                                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                    {historyRows.length === 0 ? (
                                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>—</p>
                                                    ) : (
                                                        historyRows.map((s) => (
                                                            <div
                                                                key={`${s.id}-${s.version}`}
                                                                className={`rounded-lg border px-2 py-2 text-start ${isDark ? 'border-slate-600 bg-slate-950/60' : 'border-gray-200 bg-white'}`}
                                                            >
                                                                <p className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{s.milestone_title}</p>
                                                                <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                    {s.title} · v{s.version} · {submissionStatusLabel(s.status)}
                                                                </p>
                                                                {s.submitted_by?.name ? (
                                                                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{s.submitted_by.name}</p>
                                                                ) : null}
                                                                <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                                                                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                                        {t.decidedOn}: {s.reviewed_at ? String(s.reviewed_at).slice(0, 16) : '—'}
                                                                    </span>
                                                                    {s.file_path ? (
                                                                        <a
                                                                            href={`/storage/${s.file_path}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-[10px] font-bold text-blue-600 hover:underline"
                                                                        >
                                                                            {t.openFile}
                                                                        </a>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2">
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.submissions}</p>
                                            {ideaOriginality ? (
                                                <div
                                                    className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
                                                        originalityStyles[similarityBand] || originalityStyles.unknown
                                                    }`}
                                                >
                                                    <p className="font-bold">
                                                        {t.originalityTitle}:{' '}
                                                        {similarityBand === 'unique'
                                                            ? t.unique
                                                            : similarityBand === 'partial'
                                                              ? t.partial
                                                              : similarityBand === 'high_similarity'
                                                                ? t.highSimilarity
                                                                : t.unknown}
                                                        {similarityPercent != null ? ` (${t.similarityLabel}: ${similarityPercent}%)` : ''}
                                                    </p>
                                                    <p className="mt-1">
                                                        {ideaOriginality?.message_ar || t.originalityHint}
                                                    </p>
                                                </div>
                                            ) : null}
                                            <div className={`mb-3 rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-gray-200 bg-white'}`}>
                                                <p className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.submissionsSnapshot}</p>
                                                <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                    <span>{t.pendingReviewsCount}: <strong>{submittedCount}</strong></span>
                                                    <span>{t.reviewedCount}: <strong>{reviewedCount}</strong></span>
                                                    <span>{t.needsRevisionCount}: <strong>{needsRevisionCount}</strong></span>
                                                </div>
                                            </div>
                                            {milestones.length === 0 ? (
                                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>{t.noMilestones}</p>
                                            ) : allLatest.length === 0 ? (
                                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>{t.noSubmissionsYet}</p>
                                            ) : pending.length === 0 ? (
                                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>{t.noPendingReviews}</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {pending.map((m) => {
                                                        const latest = latestSubmission(m);
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}
                                                            >
                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className={`font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                                            {t.milestone}: {m.title}
                                                                        </p>
                                                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                            {m.description || ''}
                                                                        </p>
                                                                    </div>
                                                                    {latest?.file_path ? (
                                                                        <a
                                                                            href={`/storage/${latest.file_path}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-xs font-bold text-blue-600 hover:underline"
                                                                        >
                                                                            {t.openFile}
                                                                        </a>
                                                                    ) : null}
                                                                </div>

                                                                {!latest ? (
                                                                    <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm mt-2`}>-</p>
                                                                ) : (
                                                                    <>
                                                                        <p className={`text-xs mt-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                            {latest.title} · {submissionStatusLabel(latest.status)} · v{latest.version}
                                                                        </p>
                                                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                            <button
                                                                                onClick={() => decide(latest.id, 'approve')}
                                                                                className="sr-btn-action bg-green-600 text-white hover:bg-green-700 w-auto px-3 text-xs"
                                                                            >
                                                                                {t.approve}
                                                                            </button>
                                                                            <button onClick={() => decide(latest.id, 'revise')} className="sr-btn-action-primary w-auto px-3 text-xs">
                                                                                {t.revise}
                                                                            </button>
                                                                            <button onClick={() => decide(latest.id, 'reject')} className="sr-btn-action-danger w-auto px-3 text-xs">
                                                                                {t.reject}
                                                                            </button>
                                                                        </div>
                                                                        <div className="mt-2">
                                                                            <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.notes}</label>
                                                                            <textarea
                                                                                value={notesBySubmissionId[latest.id] || ''}
                                                                                onChange={(e) => setNotesBySubmissionId((p) => ({ ...p, [latest.id]: e.target.value }))}
                                                                                rows={2}
                                                                                className={`mt-1 w-full rounded-xl text-sm ${
                                                                                    isDark ? 'bg-slate-950 border-slate-600 text-slate-100' : 'border-gray-300'
                                                                                }`}
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

