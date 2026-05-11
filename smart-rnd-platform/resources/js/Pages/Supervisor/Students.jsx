import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const statusStyle = {
    approved: 'sr-chip-emerald',
    rejected: 'sr-chip-red',
    awaiting_revision: 'sr-chip-blue',
    pending_action: 'sr-chip-amber',
};

const statusLabel = {
    approved: { ar: 'مقبول', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
    awaiting_revision: { ar: 'بانتظار التعديل', en: 'Awaiting Revision' },
    pending_action: { ar: 'بانتظار إجراء', en: 'Pending Action' },
};

const originalityStyles = {
    unique: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    partial: 'border-amber-300 bg-amber-50 text-amber-900',
    high_similarity: 'border-red-300 bg-red-50 text-red-900',
    unknown: 'border-slate-300 bg-slate-50 text-slate-800',
};

const resolveSimilarityPercent = (originality) => {
    const raw = originality?.similarity_score ?? originality?.similarity_percent ?? originality?.max_similarity;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return null;
    if (numeric >= 0 && numeric <= 1) return Math.round(numeric * 100);
    return Math.round(numeric);
};

const resolveSimilarityBand = (percent, tier) => {
    if (typeof percent === 'number') {
        if (percent < 40) return 'unique';
        if (percent <= 70) return 'partial';
        return 'high_similarity';
    }
    if (tier === 'unique') return 'unique';
    if (tier === 'similar') return 'partial';
    if (tier === 'high_match') return 'high_similarity';
    return 'unknown';
};

export default function SupervisorStudents({ teams = [], availablePlans = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const [search, setSearch] = useState(() => {
        if (typeof window === 'undefined') return '';
        return window.localStorage.getItem('supervisor_students_search') || '';
    });
    const [statusFilter, setStatusFilter] = useState(() => {
        if (typeof window === 'undefined') return 'all';
        return window.localStorage.getItem('supervisor_students_status_filter') || 'all';
    });
    const [planDraftByProjectId, setPlanDraftByProjectId] = useState({});
    const [notesBySubmissionId, setNotesBySubmissionId] = useState({});
    const [columns, setColumns] = useState(() => {
        if (typeof window === 'undefined') return '3';
        return window.localStorage.getItem('supervisor_students_columns') || '3';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('supervisor_students_search', search);
    }, [search]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('supervisor_students_status_filter', statusFilter);
    }, [statusFilter]);

    const t = isArabic
        ? {
              pageTitle: 'متابعة فرق الطلاب',
              pageDesc: 'لوحة متابعة الفرق: الخطة، التسليمات، طلبات التحديات، وحالة تقدم المشروع.',
              empty: 'لا توجد فرق لديها مشاريع حالياً.',
              searchPlaceholder: 'ابحث باسم الفريق أو القائد...',
              filterLabel: 'فلتر الحالة',
              filterAll: 'الكل',
              clearFilters: 'مسح الفلاتر',
              layoutLabel: 'تقسيم العرض',
              oneCol: 'عمود 1',
              twoCol: 'عمودان',
              threeCol: '3 أعمدة',
              totalProjects: 'إجمالي المشاريع',
              avgProgress: 'متوسط التقدم',
              approved: 'مقبولة',
              rejected: 'مرفوضة',
              pending: 'بانتظار إجراء',
              awaiting: 'بانتظار التعديل',
              latest: 'آخر مشروع',
              milestone: 'الحالة',
              recentProjects: 'أحدث المشاريع',
              reviewBtn: 'فتح المراجعة',
              openFile: 'عرض الملف',
              planTitle: 'تغيير خطة الطالب',
              choosePlan: 'اختر خطة',
              applyPlan: 'تطبيق الخطة',
              lockPlan: 'التغيير متاح فقط حتى 20%',
              deliverables: 'التسليمات',
              noMilestones: 'لا توجد مراحل بعد (عيّن خطة مراحل أولاً).',
              submissionStatus: 'حالة التسليم',
              approve: 'قبول',
              revise: 'طلب تعديل',
              reject: 'رفض',
              notes: 'ملاحظات (اختياري)',
              submissionHistory: 'سجل التسليمات',
              milestoneStages: 'مراحل المشروع',
              planName: 'الخطة',
              currentStage: 'المرحلة الحالية',
              stageCompleted: 'مكتملة',
              stageUpcoming: 'لم تبدأ بعد',
              stageInReview: 'قيد المراجعة',
              stageNeedsWork: 'تحتاج متابعة',
              allMilestonesDone: 'تم إكمال جميع المراحل المعتمدة.',
              noPendingReviews: 'لا توجد تسليمات بانتظار المراجعة.',
              decidedOn: 'تاريخ القرار',
              originalityTitle: 'تشابه الفكرة',
              similarityLabel: 'أقصى تشابه',
              matchedLabel: 'أقرب فكرة',
              uniqueBadge: 'فريدة (Unique)',
              partialBadge: 'متشابهة جزئيا (Partial)',
              highBadge: 'تشابه عال (High Similarity)',
              unknownBadge: 'غير معروف',
          }
        : {
              pageTitle: 'Teams Monitoring',
              pageDesc: 'Team monitoring dashboard: plan, deliverables, challenge requests, and project progress.',
              empty: 'No teams with projects yet.',
              searchPlaceholder: 'Search by team or leader name...',
              filterLabel: 'Status Filter',
              filterAll: 'All',
              clearFilters: 'Clear Filters',
              layoutLabel: 'Layout',
              oneCol: '1 Column',
              twoCol: '2 Columns',
              threeCol: '3 Columns',
              totalProjects: 'Total Projects',
              avgProgress: 'Average Progress',
              approved: 'Approved',
              rejected: 'Rejected',
              pending: 'Pending Action',
              awaiting: 'Awaiting Revision',
              latest: 'Latest Project',
              milestone: 'Current Status',
              recentProjects: 'Recent Projects',
              reviewBtn: 'Open review',
              openFile: 'Open file',
              planTitle: 'Change Student Plan',
              choosePlan: 'Select plan',
              applyPlan: 'Apply Plan',
              lockPlan: 'Plan change is allowed up to 20% only',
              deliverables: 'Deliverables',
              noMilestones: 'No milestones yet (assign a plan first).',
              submissionStatus: 'Submission status',
              approve: 'Approve',
              revise: 'Request revision',
              reject: 'Reject',
              notes: 'Notes (optional)',
              submissionHistory: 'Submission history',
              milestoneStages: 'Milestone stages',
              planName: 'Plan',
              currentStage: 'Current stage',
              stageCompleted: 'Done',
              stageUpcoming: 'Not started',
              stageInReview: 'In review',
              stageNeedsWork: 'Needs follow-up',
              allMilestonesDone: 'All milestones are completed.',
              noPendingReviews: 'No submissions awaiting review.',
              decidedOn: 'Decided',
              originalityTitle: 'Idea similarity',
              similarityLabel: 'Max similarity',
              matchedLabel: 'Closest idea',
              uniqueBadge: 'Unique',
              partialBadge: 'Partial',
              highBadge: 'High Similarity',
              unknownBadge: 'Unknown',
          };

    const submissionStatusLabel = (s) => {
        if (s === 'reviewed') return isArabic ? 'مراجع' : 'Reviewed';
        if (s === 'needs_revision') return isArabic ? 'بحاجة تعديل' : 'Needs revision';
        if (s === 'submitted') return isArabic ? 'بانتظار المراجعة' : 'Pending review';
        return s || '-';
    };

    const decide = (submissionId, decision) => {
        router.patch(
            route('supervisor.submissions.decide', submissionId),
            { decision, notes: notesBySubmissionId[submissionId] || null },
            { preserveScroll: true },
        );
    };

    const latestSubmission = (m) => (m?.submissions || [])[0] || null;

    const milestoneStageLabel = (m) => {
        if (m.status === 'approved') return t.stageCompleted;
        if (m.status === 'in_review') return t.stageInReview;
        if (m.status === 'rejected') return t.stageNeedsWork;
        if (m.status === 'pending') return t.stageUpcoming;
        return m.status || '—';
    };

    const pendingMilestones = (milestones) =>
        (milestones || []).filter((m) => {
            const latest = latestSubmission(m);
            return latest && latest.status === 'submitted';
        });

    const extractOriginality = (challenge) => {
        const feedbacks = challenge?.feedbacks || [];
        for (const feedback of feedbacks) {
            const comment = feedback?.comment || '';
            if (!comment.startsWith('AI_REVIEW_JSON:')) continue;
            try {
                const parsed = JSON.parse(comment.replace('AI_REVIEW_JSON:', ''));
                if (parsed?.originality) return parsed.originality;
            } catch {
                return null;
            }
        }
        return null;
    };

    const filteredTeams = useMemo(() => {
        const term = search.trim().toLowerCase();
        return teams.filter((team) => {
            const hay = [
                team?.name,
                team?.leader?.name,
                team?.project?.title,
                ...(team?.members || []).map((m) => m?.user?.name),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const nameMatch = term === '' || hay.includes(term);
            if (!nameMatch) return false;
            if (statusFilter === 'all') return true;

            const milestones = team?.project?.milestones || [];
            const latestSubs = milestones.map((m) => (m.submissions || [])[0]).filter(Boolean);
            const hasNeedsRevision = latestSubs.some((s) => s.status === 'needs_revision');
            const hasSubmitted = latestSubs.some((s) => s.status === 'submitted');
            const hasAny = latestSubs.length > 0;
            const derived =
                hasNeedsRevision ? 'awaiting_revision' : hasSubmitted ? 'pending_action' : hasAny ? 'approved' : 'pending_action';

            return derived === statusFilter;
        });
    }, [teams, search, statusFilter]);

    const gridClass = useMemo(() => {
        if (columns === '1') return 'grid-cols-1';
        if (columns === '2') return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    }, [columns]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.pageTitle}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.pageDesc}</p>
                </div>
            }
        >
            <Head title={t.pageTitle} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell">
                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 mb-5`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.searchPlaceholder}
                                className={`w-full rounded-lg ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'
                                }`}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`w-full rounded-lg ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'
                                }`}
                            >
                                <option value="all">{t.filterLabel}: {t.filterAll}</option>
                                <option value="pending_action">{t.pending}</option>
                                <option value="awaiting_revision">{t.awaiting}</option>
                                <option value="approved">{t.approved}</option>
                                <option value="rejected">{t.rejected}</option>
                            </select>
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                }}
                                className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm px-3 py-2 transition"
                            >
                                {t.clearFilters}
                            </button>
                            <select
                                value={columns}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setColumns(next);
                                    if (typeof window !== 'undefined') {
                                        window.localStorage.setItem('supervisor_students_columns', next);
                                    }
                                }}
                                className={`w-full rounded-lg ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'
                                }`}
                            >
                                <option value="1">{t.layoutLabel}: {t.oneCol}</option>
                                <option value="2">{t.layoutLabel}: {t.twoCol}</option>
                                <option value="3">{t.layoutLabel}: {t.threeCol}</option>
                            </select>
                        </div>
                    </div>

                    {filteredTeams.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>
                            {t.empty}
                        </div>
                    ) : (
                        <div className={`grid ${gridClass} gap-4`}>
                            {filteredTeams.map((team) => {
                                const milestones = team?.project?.milestones || [];
                                const orderedMilestones = [...milestones].sort(
                                    (a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0),
                                );
                                const firstOpen = orderedMilestones.find((m) => m.status !== 'approved');
                                const currentMilestoneId = firstOpen ? firstOpen.id : null;
                                const pending = pendingMilestones(milestones);
                                const latestSubs = milestones.map((m) => (m.submissions || [])[0]).filter(Boolean);
                                const hasNeedsRevision = latestSubs.some((s) => s.status === 'needs_revision');
                                const hasSubmitted = latestSubs.some((s) => s.status === 'submitted');
                                const hasAny = latestSubs.length > 0;
                                const latestStatus =
                                    hasNeedsRevision ? 'awaiting_revision' : hasSubmitted ? 'pending_action' : hasAny ? 'approved' : 'pending_action';
                                const latestRequest = (team?.challenge_requests || team?.challengeRequests || [])[0] || null;
                                const ideaOriginality = extractOriginality(team?.project?.industryChallenge);
                                const similarityPercent = resolveSimilarityPercent(ideaOriginality);
                                const similarityBand = resolveSimilarityBand(similarityPercent, ideaOriginality?.tier);
                                return (
                                    <div
                                        key={team.id}
                                        className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 hover:-translate-y-0.5 transition`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="min-w-0">
                                                <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                    {team.project?.title || team.name}
                                                </h3>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                    {isArabic ? 'الفريق' : 'Team'}: {team.name} · {isArabic ? 'القائد' : 'Leader'}: {team.leader?.name || '-'}
                                                </p>
                                            </div>
                                            <span className={statusStyle[latestStatus] || statusStyle.pending_action}>
                                                {statusLabel[latestStatus]?.[isArabic ? 'ar' : 'en'] || statusLabel.pending_action[isArabic ? 'ar' : 'en']}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className={`rounded-lg p-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                <p className="text-[11px] text-gray-500">{isArabic ? 'أعضاء الفريق' : 'Team members'}</p>
                                                <p className="font-black text-blue-600">{(team.members || []).length}</p>
                                            </div>
                                            <div className={`rounded-lg p-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                <p className="text-[11px] text-gray-500">{t.avgProgress}</p>
                                                <p className="font-black text-indigo-600">{team.project?.current_progress ?? 0}%</p>
                                            </div>
                                        </div>

                                        {team.industry_project_id ? (
                                            <div
                                                className={`rounded-[15px] p-4 mb-3 border ${isDark ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-emerald-100 bg-emerald-50'}`}
                                            >
                                                <p className={`text-xs font-bold mb-2 ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}>
                                                    {isArabic ? 'المشروع المعتمد نهائياً (مسار الشركة)' : 'Final workspace (Industry track)'}
                                                </p>
                                                <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                    {team.industry_project?.title || (isArabic ? 'تحدي الصناعة مفعّل' : 'Industry challenge active')}
                                                </p>
                                                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                    {isArabic ? 'المساحة المعتمدة للفريق:' : 'Supervisor designated workspace:'}{' '}
                                                    <strong>
                                                        {!team.supervisor_designated_workspace
                                                            ? isArabic
                                                                ? 'لم يُحدد بعد'
                                                                : 'Not yet set'
                                                            : team.supervisor_designated_workspace === 'industry'
                                                              ? isArabic
                                                                  ? 'مشروع الصناعة'
                                                                  : 'Industry project'
                                                              : isArabic
                                                                ? 'مشروع الطلاب (الخصوصية)'
                                                                : 'Student-led project'}
                                                    </strong>
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        className={`sr-btn-industry-gradient w-auto px-3 text-[11px] ${team.supervisor_designated_workspace === 'industry' ? 'ring-2 ring-white/80' : ''}`}
                                                        onClick={() =>
                                                            router.patch(route('supervisor.teams.workspace', team.id), { workspace: 'industry' })
                                                        }
                                                    >
                                                        {isArabic ? 'اعتماد مسار الصناعة' : 'Designate industry'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`sr-btn-industry-gradient-reverse w-auto px-3 text-[11px] ${team.supervisor_designated_workspace === 'student' ? 'ring-2 ring-white/80' : ''}`}
                                                        onClick={() =>
                                                            router.patch(route('supervisor.teams.workspace', team.id), { workspace: 'student' })
                                                        }
                                                    >
                                                        {isArabic ? 'اعتماد مشروع الطلاب' : 'Designate student project'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}>
                                            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-blue-800'}`}>{isArabic ? 'طلب التحدي' : 'Challenge request'}</p>
                                            {!latestRequest ? (
                                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-700'} text-sm`}>-</p>
                                            ) : (
                                                <>
                                                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                                        {latestRequest.industry_challenge?.title || latestRequest.industryChallenge?.title || '-'}
                                                    </p>
                                                    <p className="text-xs text-blue-600">
                                                        {isArabic ? 'الحالة' : 'Status'}: {latestRequest.status}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {ideaOriginality ? (
                                            <div
                                                className={`rounded-lg border p-3 mb-3 ${
                                                    originalityStyles[similarityBand] || originalityStyles.unknown
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-xs font-bold">{t.originalityTitle}</p>
                                                    <span className="rounded-full border border-current px-2 py-0.5 text-[11px] font-bold">
                                                        {similarityBand === 'unique'
                                                            ? t.uniqueBadge
                                                            : similarityBand === 'partial'
                                                              ? t.partialBadge
                                                              : similarityBand === 'high_similarity'
                                                                ? t.highBadge
                                                                : t.unknownBadge}
                                                    </span>
                                                </div>
                                                <p className="text-xs mt-1">{ideaOriginality.message_ar || '-'}</p>
                                                {similarityPercent != null ? (
                                                    <p className="text-[11px] mt-1">
                                                        {t.similarityLabel}: {similarityPercent}%
                                                    </p>
                                                ) : null}
                                                {ideaOriginality.matched_title ? (
                                                    <p className="text-[11px] mt-1">
                                                        {t.matchedLabel}: {ideaOriginality.matched_title}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <div className={`rounded-lg p-3 mb-3 border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.planTitle}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <select
                                                    value={planDraftByProjectId[team.project_id] || team.project?.milestone_plan_id || ''}
                                                    onChange={(e) =>
                                                        setPlanDraftByProjectId((prev) => ({
                                                            ...prev,
                                                            [team.project_id]: e.target.value,
                                                        }))
                                                    }
                                                    className={`flex-1 min-w-[8rem] rounded-lg text-xs h-11 md:h-12 px-2 ${
                                                        isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <option value="">{t.choosePlan}</option>
                                                    {availablePlans.map((plan) => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {plan.name} ({plan.scope})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const selectedPlanId = planDraftByProjectId[team.project_id] || team.project?.milestone_plan_id;
                                                        if (!selectedPlanId || !team.project_id) return;
                                                        router.patch(
                                                            route('supervisor.projects.plan', team.project_id),
                                                            { milestone_plan_id: selectedPlanId },
                                                        );
                                                    }}
                                                    className="sr-btn-action-secondary w-auto shrink-0 px-4 text-xs"
                                                >
                                                    {t.applyPlan}
                                                </button>
                                            </div>

                                            <div className={`mt-3 border-t pt-3 ${isDark ? 'border-slate-600/50' : 'border-gray-200'}`}>
                                                <div className="mb-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className={`text-xs font-bold leading-tight ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.milestoneStages}</p>
                                                        <Link
                                                            href={`${route('supervisor.projects')}#supervisor-team-${team.id}-submission-history`}
                                                            className="sr-btn-action-secondary inline-flex w-auto shrink-0 px-3 text-[11px] font-bold"
                                                        >
                                                            {t.submissionHistory}
                                                        </Link>
                                                    </div>
                                                    {team.project?.milestonePlan?.name ? (
                                                        <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {t.planName}: {team.project.milestonePlan.name}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                {orderedMilestones.length === 0 ? (
                                                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.noMilestones}</p>
                                                ) : (
                                                    <>
                                                        {!currentMilestoneId && orderedMilestones.every((m) => m.status === 'approved') ? (
                                                            <p className={`text-[11px] mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{t.allMilestonesDone}</p>
                                                        ) : null}
                                                        <ol
                                                            className={`sr-scroll-area space-y-2 max-h-56 overflow-y-auto pr-1 ${
                                                                isDark ? 'sr-scroll-area-dark' : 'sr-scroll-area-light'
                                                            }`}
                                                        >
                                                            {orderedMilestones.map((m, idx) => {
                                                                const isCurrent =
                                                                    currentMilestoneId !== null && Number(m.id) === Number(currentMilestoneId);
                                                                const isDone = m.status === 'approved';
                                                                return (
                                                                    <li
                                                                        key={m.id}
                                                                        className={`rounded-lg border px-2 py-2 text-start transition ${
                                                                            isCurrent
                                                                                ? isDark
                                                                                    ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/40'
                                                                                    : 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                                                                : isDone
                                                                                  ? isDark
                                                                                      ? 'border-emerald-800/60 bg-emerald-950/30'
                                                                                      : 'border-emerald-200 bg-emerald-50/80'
                                                                                  : isDark
                                                                                    ? 'border-slate-600 bg-slate-950/50'
                                                                                    : 'border-gray-200 bg-white'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                                                        {idx + 1}.
                                                                                    </span>
                                                                                    <p className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                                                        {m.title}
                                                                                    </p>
                                                                                    {isCurrent ? (
                                                                                        <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                                                                                            {t.currentStage}
                                                                                        </span>
                                                                                    ) : null}
                                                                                </div>
                                                                                {m.description ? (
                                                                                    <p className={`text-[10px] mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                                        {m.description}
                                                                                    </p>
                                                                                ) : null}
                                                                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                                    {milestoneStageLabel(m)}
                                                                                    {m.due_date ? ` · ${m.due_date}` : ''}
                                                                                </p>
                                                                            </div>
                                                                            {isDone ? (
                                                                                <span className="text-base shrink-0 leading-none" aria-hidden>
                                                                                    ✓
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ol>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`rounded-lg p-3 mb-3 border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.deliverables}</p>
                                            {milestones.length === 0 ? (
                                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>{t.noMilestones}</p>
                                            ) : pending.length === 0 ? (
                                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>{t.noPendingReviews}</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {pending.map((m) => {
                                                        const latest = latestSubmission(m);
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-950' : 'border-gray-200 bg-gray-50'}`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <p className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{m.title}</p>
                                                                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{m.description || ''}</p>
                                                                        <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                            {t.submissionStatus}: {submissionStatusLabel(latest?.status)}
                                                                            {latest?.version ? ` · v${latest.version}` : ''}
                                                                        </p>
                                                                    </div>
                                                                    {latest?.file_path ? (
                                                                        <a
                                                                            href={`/storage/${latest.file_path}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                                                        >
                                                                            {t.openFile}
                                                                        </a>
                                                                    ) : null}
                                                                </div>

                                                                {latest ? (
                                                                    <>
                                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decide(latest.id, 'approve')}
                                                                                className="inline-flex items-center justify-center h-11 md:h-12 rounded-xl px-4 text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition shrink-0 active:scale-[0.99]"
                                                                            >
                                                                                {t.approve}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decide(latest.id, 'revise')}
                                                                                className="sr-btn-action-primary w-auto shrink-0 px-4 text-xs"
                                                                            >
                                                                                {t.revise}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decide(latest.id, 'reject')}
                                                                                className="inline-flex items-center justify-center h-11 md:h-12 rounded-xl px-4 text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shrink-0 active:scale-[0.99]"
                                                                            >
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
                                                                                    isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'
                                                                                }`}
                                                                            />
                                                                        </div>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Link href={route('supervisor.projects')} className="sr-btn-action-primary h-10 md:h-10">
                                                {isArabic ? 'فتح Team Projects' : 'Open Team Projects'}
                                            </Link>
                                            <Link href={route('supervisor.challenge-requests.pending')} className="sr-btn-action-secondary h-10 md:h-10">
                                                {isArabic ? 'فتح طلبات التحديات' : 'Open challenge requests'}
                                            </Link>
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
