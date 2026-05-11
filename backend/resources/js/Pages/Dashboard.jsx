import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/ui/StatCard';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Check,
    CircleCheck,
    CircleX,
    Eye,
    GraduationCap,
    Hourglass,
    ListChecks,
    MessageCircle,
    Puzzle,
    SlidersHorizontal,
    Sparkles,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'لوحة التحكم',
        progressPath: 'مسار انجاز المشروع',
        currentStage: 'المرحلة الحالية',
        uploadTitle: 'رفع الفكرة والمستندات',
        uploadDesc: 'ارفع خطة البحث او تحديثات المشروع الدورية للمراجعة.',
        uploadBtn: 'فتح صفحة الرفع',
        milestonesTitle: 'سجل الانجازات',
        milestonesDesc: 'راجع حالة المراحل الحالية وملاحظات المشرف.',
        milestonesBtn: 'مشاهدة السجل',
        contactTitle: 'التواصل',
        contactDesc: 'مساحة تواصل المشروع مع الفريق والمشرف (قريبا).',
        contactBtn: 'قريبا',
        modalTitle: 'رفع وثائق المشروع',
        ideaTitle: 'عنوان الفكرة/المرحلة',
        summary: 'وصف موجز',
        chooseFile: 'اضغط لاختيار ملف',
        submit: 'تاكيد الارسال',
        uploading: 'جاري الرفع...',
        noProjectYet: 'لم يتم رفع مشروع بعد',
        revisionNeededTitle: 'تم طلب تعديل من المشرف',
        revisionNeededDesc: 'بعد تنفيذ الملاحظات، اضغط زر "تم التنفيذ من الطالب" لإعادة الطلب للمراجعة.',
        revisionCommentPlaceholder: 'اكتب ماذا عدّلت (اختياري)...',
        revisionResubmitBtn: 'تم التنفيذ من الطالب',
        revisionResubmitting: 'جاري الإرسال...',
        supervisorTitle: 'لوحة المتابعة',
        supervisorDesc: 'راجع ملفات الطلاب، اكتب ملاحظاتك، ثم وافق او ارفض او اطلب تعديل قبل الاعتماد.',
        selectMilestone: 'اختر milestone قبل القبول',
        milestoneIdea: 'الفكرة (10%)',
        milestoneAnalysis: 'تحليل النظام (40%)',
        milestoneImplementation: 'التنفيذ (70%)',
        milestoneFinal: 'الاعتماد النهائي (100%)',
        studentLabel: 'الطالب',
        progressLabel: 'التقدم',
        currentMilestone: 'الحالة',
        openFile: 'عرض الملف',
        aiSuggestion: 'تحليل AI المقترح',
        notePlaceholder: 'اكتب ملاحظة للطالب (مثال: عدل المقدمة ووضّح منهجية الحل)...',
        requestChanges: 'طلب تعديل',
        approve: 'قبول',
        reject: 'رفض',
        emptySupervisor: 'لا توجد طلبات طلاب حالياً.',
        acceptedTab: 'مقبولة',
        rejectedTab: 'مرفوضة',
        pendingTab: 'بانتظار اتخاذ إجراء',
        awaitingRevisionTab: 'بانتظار التعديل',
        notificationsTitle: 'الإشعارات',
        noNotifications: 'لا توجد إشعارات حتى الآن.',
        groupChatFrom: 'من',
        openGroupChat: 'فتح المحادثة',
        newBadge: 'جديد',
        quickApprove: 'موافقة سريعة',
        quickChat: 'دردشة',
        quickView: 'استعراض الملف',
        aiSummaryBtn: 'عرض ملخص الـ AI',
        aiModalTitle: 'ملخص الذكاء الاصطناعي للمراجعة',
        qualityScore: 'تقييم مبدئي للجودة',
        reviewTimeline: 'الخط الزمني للمتابعة',
        statusApproved: 'مقبول',
        statusRejected: 'مرفوض',
        statusPending: 'بانتظار الإجراء',
        statusAwaiting: 'بانتظار التعديل',
        smartStats: 'مؤشرات ذكية',
        industryTitle: 'لوحة جهة الصناعة',
        industryDesc: 'إدارة التحديات والطلبات المرتبطة بجهة الصناعة بطريقة احترافية.',
        totalChallenges: 'إجمالي التحديات',
        underReview: 'قيد المراجعة',
        accepted: 'مقبولة',
        openWorkspace: 'فتح مساحة العمل',
        openChallenges: 'فتح التحديات',
        milestoneTrackerTitle: 'تقدم الفرق على تحدياتك',
        milestoneTrackerDesc: 'متابعة نسبة الإنجاز والمراحل للفرق المعتمدة التي تعمل على تحدياتك.',
        noTeamProgress: 'لا يوجد فريق مرتبط بتحدياتك بعد؛ عند قبول فريق سيظهر تقدمه هنا.',
        colChallenge: 'التحدي',
        colTeam: 'الفريق',
        colLeader: 'القائد',
        colProgress: 'التقدم',
        colCurrentStage: 'المرحلة الحالية',
        planLabel: 'الخطة',
        allMilestonesCompleteIndustry: 'تم إكمال جميع المراحل',
        studentStatProgress: 'نسبة الإنجاز',
        studentStatStage: 'المرحلة الحالية',
    },
    en: {
        title: 'Dashboard',
        progressPath: 'Project Progress',
        currentStage: 'Current stage',
        uploadTitle: 'Upload idea & documents',
        uploadDesc: 'Submit your proposal files and milestone updates for review.',
        uploadBtn: 'Open Upload Page',
        milestonesTitle: 'Milestone Log',
        milestonesDesc: 'Review project stage updates and supervisor feedback.',
        milestonesBtn: 'View Milestones',
        contactTitle: 'Communication',
        contactDesc: 'Project communication hub (coming soon).',
        contactBtn: 'Soon',
        modalTitle: 'Upload Project Documents',
        ideaTitle: 'Idea/Milestone title',
        summary: 'Summary',
        chooseFile: 'Click to choose file',
        submit: 'Submit',
        uploading: 'Uploading...',
        noProjectYet: 'No project uploaded yet',
        revisionNeededTitle: 'Revision Requested by Supervisor',
        revisionNeededDesc: 'After applying updates, click "Student Completed Changes" to resubmit for review.',
        revisionCommentPlaceholder: 'Write what you changed (optional)...',
        revisionResubmitBtn: 'Student Completed Changes',
        revisionResubmitting: 'Sending...',
        supervisorTitle: 'Tracking Panel',
        supervisorDesc: 'Review student files, add feedback, then approve/reject/request changes.',
        selectMilestone: 'Select milestone before approval',
        milestoneIdea: 'Idea (10%)',
        milestoneAnalysis: 'Analysis (40%)',
        milestoneImplementation: 'Implementation (70%)',
        milestoneFinal: 'Final (100%)',
        studentLabel: 'Student',
        progressLabel: 'Progress',
        currentMilestone: 'Status',
        openFile: 'Open file',
        aiSuggestion: 'AI Suggested Feedback',
        notePlaceholder: 'Write feedback for student...',
        requestChanges: 'Request changes',
        approve: 'Approve',
        reject: 'Reject',
        emptySupervisor: 'No student submissions yet.',
        acceptedTab: 'Approved',
        rejectedTab: 'Rejected',
        pendingTab: 'Pending Action',
        awaitingRevisionTab: 'Awaiting Revision',
        notificationsTitle: 'Notifications',
        noNotifications: 'No notifications yet.',
        groupChatFrom: 'From',
        openGroupChat: 'Open chat',
        newBadge: 'New',
        quickApprove: 'Quick Approve',
        quickChat: 'Chat',
        quickView: 'View file',
        aiSummaryBtn: 'View AI Summary',
        aiModalTitle: 'AI Review Summary',
        qualityScore: 'Initial Quality Score',
        reviewTimeline: 'Review Timeline',
        statusApproved: 'Approved',
        statusRejected: 'Rejected',
        statusPending: 'Pending Action',
        statusAwaiting: 'Awaiting Revision',
        smartStats: 'Smart Insights',
        industryTitle: 'Industry Dashboard',
        industryDesc: 'Manage industry challenges and reviews in a professional workflow.',
        totalChallenges: 'Total Challenges',
        underReview: 'Under Review',
        accepted: 'Accepted',
        openWorkspace: 'Open Workspace',
        openChallenges: 'Open Challenges',
        milestoneTrackerTitle: 'Team progress on your challenges',
        milestoneTrackerDesc: 'Track completion and milestone stages for teams working on challenges you posted.',
        noTeamProgress: 'No team is linked to your challenges yet. When a team is accepted, their progress will show here.',
        colChallenge: 'Challenge',
        colTeam: 'Team',
        colLeader: 'Leader',
        colProgress: 'Progress',
        colCurrentStage: 'Current stage',
        planLabel: 'Plan',
        allMilestonesCompleteIndustry: 'All milestones complete',
        studentStatProgress: 'Completion',
        studentStatStage: 'Current stage',
    },
};

export default function Dashboard({
    challenges = [],
    notifications = [],
    milestoneTracker = [],
    selectedStudentId = null,
    quickChatByStudentId = {},
    milestoneOptionsByStudentId = {},
    reviewItems = null,
    reviewStats = null,
}) {
    const { auth, flash } = usePage().props;
    const { lang, isArabic, isDark } = useUiPreferences();
    const t = labels[lang];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [commentsById, setCommentsById] = useState({});
    const [milestoneById, setMilestoneById] = useState({});
    const [statusFilter, setStatusFilter] = useState('pending_action');
    const [resubmitNote, setResubmitNote] = useState('');
    const [resubmitting, setResubmitting] = useState(false);
    const [activeAi, setActiveAi] = useState(null);
    const role = auth?.user?.role;
    const isStudent = role === 'student';
    const isSupervisor = role === 'supervisor' || role === 'admin';
    const isIndustry = role === 'industry';
    const isSupervisorRequestsPage =
        isSupervisor && typeof route === 'function' && route().current('supervisor.requests');
    const layoutPageTitle = isSupervisorRequestsPage ? t.supervisorTitle : t.title;

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        title: '',
        description: '',
        file: null,
    });

    useEffect(() => {
        if (!isSupervisor || typeof window === 'undefined') return;
        const saved = window.localStorage.getItem('srnd_review_status_filter');
        if (saved) {
            setStatusFilter(saved);
        }
    }, [isSupervisor]);

    useEffect(() => {
        if (!isSupervisor || typeof window === 'undefined') return;
        window.localStorage.setItem('srnd_review_status_filter', statusFilter);
    }, [isSupervisor, statusFilter]);

    const myProject = useMemo(
        () =>
            challenges[0] || {
                progress: 0,
                current_milestone: isArabic ? t.noProjectYet : 'No project yet',
            },
        [challenges, isArabic, t.noProjectYet],
    );

    const submit = (e) => {
        e.preventDefault();
        post(route('challenges.store'), {
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
            },
        });
    };

    const updateProjectDecision = (challengeId, decision) => {
        const project = challenges.find((c) => c.id === challengeId);
        const studentId = String(project?.posted_by_user_id || project?.postedBy?.id || '');
        const options = milestoneOptionsByStudentId?.[studentId] || [];
        const defaultMilestoneId = options[0]?.id ?? 'default:idea';
        router.patch(
            route('challenges.updateProgress', challengeId),
            {
                decision,
                milestone_id: milestoneById[challengeId] || defaultMilestoneId,
                comment: commentsById[challengeId] || null,
            },
            { preserveScroll: true },
        );
    };

    const parseAiFeedback = (project) => {
        const list = project?.feedbacks || [];
        for (const f of list) {
            if ((f.comment || '').startsWith('AI_REVIEW_JSON:')) {
                try {
                    const parsed = JSON.parse(f.comment.replace('AI_REVIEW_JSON:', ''));
                    const summaryCount = Array.isArray(parsed?.summary) ? parsed.summary.length : 0;
                    const suggestionCount = Array.isArray(parsed?.suggestions) ? parsed.suggestions.length : 0;
                    const computedQuality = Math.max(40, Math.min(95, 70 + summaryCount * 6 - suggestionCount * 5));
                    return {
                        ...parsed,
                        quality_score: parsed?.quality_score ?? computedQuality,
                    };
                } catch {
                    return null;
                }
            }
        }
        const legacy = list.find((f) => (f.comment || '').startsWith('AI Review'));
        if (!legacy) return null;
        return {
            provider: 'legacy',
            summary: [legacy.comment],
            suggestions: [],
            quality_score: 65,
        };
    };

    const getMilestonePathForProject = (project) => {
        const sid = String(project.posted_by_user_id || project.postedBy?.id || '');
        const options = milestoneOptionsByStudentId?.[sid] || [];
        if (options.length > 0) return options;
        return [
            { id: 'default:idea', label: t.milestoneIdea, progress: 10 },
            { id: 'default:analysis', label: t.milestoneAnalysis, progress: 40 },
            { id: 'default:implementation', label: t.milestoneImplementation, progress: 70 },
            { id: 'default:final', label: t.milestoneFinal, progress: 100 },
        ];
    };

    const handleStudentResubmit = (challengeId) => {
        setResubmitting(true);
        router.patch(
            route('challenges.resubmit', challengeId),
            { comment: resubmitNote || null },
            {
                preserveScroll: true,
                onFinish: () => setResubmitting(false),
            },
        );
    };

    const isNewReviewQueue = isSupervisor && Array.isArray(reviewItems);
    const stats = useMemo(
        () => ({
            pending: challenges.filter((c) => (c.review_status || 'pending_action') === 'pending_action').length,
            awaiting_revision: challenges.filter((c) => c.review_status === 'awaiting_revision').length,
            approved: challenges.filter((c) => c.review_status === 'approved').length,
            rejected: challenges.filter((c) => c.review_status === 'rejected').length,
        }),
        [challenges],
    );
    const reviewQueueStats = useMemo(() => {
        if (!isNewReviewQueue) {
            return stats;
        }
        const s = reviewStats || {};
        return {
            pending: Number(s.pending_action || 0),
            awaiting_revision: Number(s.awaiting_revision || 0),
            approved: Number(s.approved || 0),
            rejected: Number(s.rejected || 0),
        };
    }, [isNewReviewQueue, reviewStats, stats]);

    const filteredChallenges = useMemo(() => {
        if (!isSupervisor) return challenges;
        if (isNewReviewQueue) return [];
        return challenges.filter((item) => {
            const statusOk = (item.review_status || 'pending_action') === statusFilter;
            if (!statusOk) return false;
            if (!selectedStudentId) return true;
            return Number(item.posted_by_user_id) === Number(selectedStudentId) || Number(item.postedBy?.id) === Number(selectedStudentId);
        });
    }, [challenges, isSupervisor, isNewReviewQueue, selectedStudentId, statusFilter]);

    const filteredReviewItems = useMemo(() => {
        if (!isNewReviewQueue) return [];
        return (reviewItems || []).filter((row) => {
            const status = row.submission_status;
            const matches =
                (statusFilter === 'pending_action' && status === 'submitted') ||
                (statusFilter === 'awaiting_revision' && status === 'needs_revision') ||
                (statusFilter === 'approved' && status === 'reviewed') ||
                (statusFilter === 'rejected' && status === 'rejected');
            if (!matches) return false;
            if (!selectedStudentId) return true;
            return Number(row.student_id) === Number(selectedStudentId);
        });
    }, [isNewReviewQueue, reviewItems, statusFilter, selectedStudentId]);

    const totalChallenges = useMemo(() => {
        if (isNewReviewQueue) return Math.max((reviewItems || []).length, 1);
        return Math.max(challenges.length, 1);
    }, [isNewReviewQueue, reviewItems, challenges.length]);
    const statusBadgeClass = (status) => {
        if (status === 'rejected') return 'sr-chip-red';
        if (status === 'approved') return 'sr-chip-emerald';
        if (status === 'awaiting_revision') return 'sr-chip-amber';
        return 'sr-chip-amber';
    };
    const statusLabel = (status) => {
        if (status === 'rejected') return t.statusRejected;
        if (status === 'approved') return t.statusApproved;
        if (status === 'awaiting_revision') return t.statusAwaiting;
        return t.statusPending;
    };
    const completedCount = reviewQueueStats.approved;
    const atRiskCount = reviewQueueStats.rejected + reviewQueueStats.awaiting_revision;
    const completionPercent = Math.round((completedCount / totalChallenges) * 100);

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl leading-tight ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{layoutPageTitle}</h2>}>
            <Head title={layoutPageTitle} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-12 transition-colors ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && (
                        <div className="sr-alert-success mb-4">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="sr-alert-error mb-4">{flash.error}</div>
                    )}

                    {isStudent && (
                        <>
                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <StatCard
                                    icon={TrendingUp}
                                    label={t.studentStatProgress}
                                    value={`${myProject.progress ?? 0}%`}
                                    tone="blue"
                                    isDark={isDark}
                                />
                                <StatCard
                                    icon={GraduationCap}
                                    label={t.studentStatStage}
                                    value={
                                        String(myProject.current_milestone || '').length > 42
                                            ? `${String(myProject.current_milestone).slice(0, 42)}…`
                                            : myProject.current_milestone || '—'
                                    }
                                    tone="emerald"
                                    isDark={isDark}
                                />
                            </div>
                            <div className={`p-8 mb-8 hover:shadow-md transition-all duration-300 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                                <div className="flex justify-between mb-4">
                                    <div>
                                        <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.progressPath}</h3>
                                        <p className={`text-sm font-medium tracking-wide ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>
                                            {t.currentStage}: {myProject.current_milestone}
                                        </p>
                                    </div>
                                    <span className={`text-2xl font-black ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{myProject.progress}%</span>
                                </div>

                                <div className={`w-full rounded-full h-4 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                    <div className="bg-gradient-to-r from-blue-600 via-blue-400 to-green-400 h-full transition-all duration-1000 ease-out" style={{ width: `${myProject.progress}%` }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div
                                        className={`p-8 border-t-4 border-green-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isDark ? 'sr-card-dark' : 'sr-card-light'} flex flex-col h-full`}
                                    >
                                        <div
                                            className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200"
                                            aria-hidden
                                        >
                                            <ListChecks className="h-6 w-6" strokeWidth={1.75} />
                                        </div>
                                        <h3 className={`font-bold text-xl mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.milestonesTitle}</h3>
                                        <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>{t.milestonesDesc}</p>
                                        <Link href={route('milestones.index')} className="sr-btn-action bg-green-600 text-white hover:bg-green-700 mt-auto">
                                            {t.milestonesBtn}
                                        </Link>
                                    </div>

                                    <div
                                        className={`p-8 border-t-4 border-purple-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isDark ? 'sr-card-dark' : 'sr-card-light'} flex flex-col h-full`}
                                    >
                                        <div
                                            className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/22 bg-violet-500/[0.08] text-violet-700 shadow-sm dark:border-violet-400/28 dark:bg-violet-500/12 dark:text-violet-200"
                                            aria-hidden
                                        >
                                            <Puzzle className="h-6 w-6" strokeWidth={1.75} />
                                        </div>
                                        <h3 className={`font-bold text-xl mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'تحديات الصناعة' : 'Industry Challenges'}</h3>
                                        <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                                            {isArabic ? 'استكشف التحديات المعتمدة واطلب اعتمادها من مشرف مجموعتك.' : 'Browse approved challenges and request supervisor approval.'}
                                        </p>
                                        <Link href={route('student.industry-challenges')} className="sr-btn-action-primary mt-auto">
                                            {isArabic ? 'فتح التحديات' : 'Open challenges'}
                                        </Link>
                                    </div>
                                </div>

                                {/* Sidebar: quick upload (relocated) */}
                                <aside className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.uploadTitle}</h3>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.uploadDesc}</p>
                                        </div>
                                        <Link href={route('student.uploads')} className="text-xs font-bold text-blue-600 hover:underline">
                                            {isArabic ? 'المزيد' : 'More'}
                                        </Link>
                                    </div>

                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            router.post(route('student.uploads.store'), data, { forceFormData: true, preserveScroll: true, onSuccess: () => reset('file') });
                                        }}
                                        className="mt-4 space-y-3"
                                    >
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder={t.ideaTitle}
                                            className={`w-full rounded-lg text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder={t.summary}
                                            rows={3}
                                            className={`w-full rounded-xl text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <input
                                            type="file"
                                            onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                            className={`w-full rounded-lg text-xs ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <button type="submit" disabled={processing} className="sr-btn-action-primary w-full disabled:opacity-60">
                                            {processing ? t.uploading : t.submit}
                                        </button>
                                        {(errors?.title || errors?.description || errors?.file) && (
                                            <div className="text-xs text-red-500 space-y-1">
                                                {errors?.title ? <p>{errors.title}</p> : null}
                                                {errors?.description ? <p>{errors.description}</p> : null}
                                                {errors?.file ? <p>{errors.file}</p> : null}
                                            </div>
                                        )}
                                    </form>
                                </aside>
                            </div>

                            {myProject.review_status === 'awaiting_revision' && (
                                <div className={`mt-6 p-6 rounded-2xl border ${isDark ? 'sr-card-dark' : 'bg-amber-50 border-amber-200'}`}>
                                    <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                                        {t.revisionNeededTitle}
                                    </h3>
                                    <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-amber-800'}`}>
                                        {t.revisionNeededDesc}
                                    </p>
                                    <textarea
                                        value={resubmitNote}
                                        onChange={(e) => setResubmitNote(e.target.value)}
                                        className={`w-full rounded-xl text-sm ${
                                            isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-amber-300 bg-white text-gray-800'
                                        }`}
                                        rows="3"
                                        placeholder={t.revisionCommentPlaceholder}
                                    />
                                    <button
                                        onClick={() => handleStudentResubmit(myProject.id)}
                                        disabled={resubmitting}
                                        className="mt-3 sr-btn-action-primary w-auto px-4 disabled:bg-gray-400"
                                    >
                                        {resubmitting ? t.revisionResubmitting : t.revisionResubmitBtn}
                                    </button>
                                </div>
                            )}

                            <div className={`mt-6 p-6 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.notificationsTitle}</h3>
                                {notifications.length === 0 ? (
                                    <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noNotifications}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.kind === 'group_chat' ? `gc-${n.id}` : `sn-${n.id}`}
                                                className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}
                                            >
                                                <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{n.title}</p>
                                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{n.message}</p>
                                                {n.kind === 'group_chat' ? (
                                                    <>
                                                        <p className="text-xs text-purple-600 mt-1">
                                                            {t.groupChatFrom}: {n.sender?.name}
                                                            {n.group?.name ? ` · ${n.group.name}` : ''}
                                                            {!n.is_read && (
                                                                <span className="ms-2 font-bold text-amber-600">({t.newBadge})</span>
                                                            )}
                                                        </p>
                                                        <Link
                                                            href={route('supervisor.groups.chat', n.group_id)}
                                                            className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                                                        >
                                                            {t.openGroupChat}
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        {n.supervisor?.name || (isArabic ? 'المشرف' : 'Supervisor')}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {isIndustry && (
                        <div className="space-y-6">
                            <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.industryTitle}</h3>
                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mb-5`}>{t.industryDesc}</p>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <StatCard
                                        icon={Trophy}
                                        label={t.totalChallenges}
                                        value={challenges.length}
                                        tone="blue"
                                        isDark={isDark}
                                    />
                                    <StatCard
                                        icon={Hourglass}
                                        label={t.underReview}
                                        value={stats.pending + stats.awaiting_revision}
                                        tone="amber"
                                        isDark={isDark}
                                    />
                                    <StatCard
                                        icon={BadgeCheck}
                                        label={t.accepted}
                                        value={stats.approved}
                                        tone="emerald"
                                        isDark={isDark}
                                    />
                                </div>
                                <div className="mt-5">
                                    <Link href={route('industry.portal')} className="sr-btn-action-primary w-auto px-4">
                                        {t.openChallenges}
                                    </Link>
                                </div>
                            </div>

                            <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                                <h3 className={`text-xl font-black mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.milestoneTrackerTitle}</h3>
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.milestoneTrackerDesc}</p>
                                {milestoneTracker.length === 0 ? (
                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.noTeamProgress}</p>
                                ) : (
                                    <div className="space-y-4">
                                        {milestoneTracker.map((row) => (
                                            <div
                                                key={row.project_id}
                                                className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'}`}
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                                    <div className="min-w-0">
                                                        <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t.colChallenge}</p>
                                                        <p className={`font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{row.challenge?.title || '—'}</p>
                                                        {row.milestone_plan_name ? (
                                                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                {t.planLabel}: {row.milestone_plan_name}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-end min-w-0">
                                                        <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t.colTeam}</p>
                                                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{row.team?.name || '—'}</p>
                                                        {row.team?.leader_name ? (
                                                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                {t.colLeader}: {row.team.leader_name}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{t.colProgress}</span>
                                                        <span className="text-blue-600">{row.current_progress ?? 0}%</span>
                                                    </div>
                                                    <div className={`w-full rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                                                            style={{ width: `${Math.min(100, Math.max(0, row.current_progress ?? 0))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.colCurrentStage}</p>
                                                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                                        {row.milestone_count > 0 && row.approved_count === row.milestone_count
                                                            ? t.allMilestonesCompleteIndustry
                                                            : row.current_milestone_title || '—'}
                                                    </p>
                                                    {row.milestones?.length > 0 ? (
                                                        <ol className="mt-2 flex flex-wrap gap-1.5">
                                                            {row.milestones.map((m, idx) => {
                                                                const done = m.status === 'approved';
                                                                const isCurrent =
                                                                    row.current_milestone_id != null &&
                                                                    Number(m.id) === Number(row.current_milestone_id);
                                                                return (
                                                                    <li
                                                                        key={m.id}
                                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                            done
                                                                                ? isDark
                                                                                    ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
                                                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                                                : isCurrent
                                                                                  ? isDark
                                                                                      ? 'border-blue-500 bg-blue-950/50 text-blue-200'
                                                                                      : 'border-blue-300 bg-blue-50 text-blue-800'
                                                                                  : isDark
                                                                                    ? 'border-slate-600 text-slate-400'
                                                                                    : 'border-gray-200 text-gray-500'
                                                                        }`}
                                                                    >
                                                                        {idx + 1}. {m.title}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ol>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isSupervisor && (
                        <div className={`p-8 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                            <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.supervisorTitle}</h3>
                            <p className={`mb-6 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.supervisorDesc}</p>
                            <div className="mb-6">
                                <p className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.smartStats}</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        {
                                            key: 'pending',
                                            icon: Hourglass,
                                            tone: 'amber',
                                            value: reviewQueueStats.pending,
                                        },
                                        {
                                            key: 'awaiting_revision',
                                            icon: SlidersHorizontal,
                                            tone: 'violet',
                                            value: reviewQueueStats.awaiting_revision,
                                        },
                                        {
                                            key: 'approved',
                                            icon: CircleCheck,
                                            tone: 'emerald',
                                            value: reviewQueueStats.approved,
                                        },
                                        {
                                            key: 'rejected',
                                            icon: CircleX,
                                            tone: 'red',
                                            value: reviewQueueStats.rejected,
                                        },
                                    ].map((item) => (
                                        <StatCard
                                            key={item.key}
                                            icon={item.icon}
                                            label={statusLabel(item.key)}
                                            value={item.value}
                                            tone={item.tone}
                                            isDark={isDark}
                                        />
                                    ))}
                                </div>
                                <div className={`mt-4 rounded-2xl border p-4 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                                {isArabic ? 'تحليل الإنجاز' : 'Completion Analytics'}
                                            </p>
                                            <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {isArabic ? 'المشاريع المكتملة مقابل المتعثرة' : 'Completed vs at-risk projects'}
                                            </p>
                                        </div>
                                        <div
                                            className="h-14 w-14 rounded-full"
                                            style={{
                                                background: `conic-gradient(#10b981 ${completionPercent}%, #ef4444 ${completionPercent}% 100%)`,
                                            }}
                                        />
                                    </div>
                                    <div className={`mt-3 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${completionPercent}%` }} />
                                    </div>
                                    <div className="mt-2 text-xs flex items-center justify-between">
                                        <span className="text-emerald-600">{isArabic ? 'مكتمل' : 'Completed'}: {completedCount}</span>
                                        <span className="text-red-600">{isArabic ? 'متعثر' : 'At Risk'}: {atRiskCount}</span>
                                        <span className={`${isDark ? 'text-slate-200' : 'text-gray-700'} font-bold`}>{completionPercent}%</span>
                                    </div>
                                </div>
                            </div>
                            {selectedStudentId && (
                                <div className={`mb-4 rounded-lg px-3 py-2 text-xs font-semibold ${isDark ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
                                    {isArabic ? 'تم تفعيل فلترة حسب الطالب المختار' : 'Filtered by selected student'}
                                </div>
                            )}

                            <div className="mb-5 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setStatusFilter('pending_action')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                                        statusFilter === 'pending_action' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {t.pendingTab} ({reviewQueueStats.pending})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('approved')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                                        statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {t.acceptedTab} ({reviewQueueStats.approved})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('awaiting_revision')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                                        statusFilter === 'awaiting_revision' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {t.awaitingRevisionTab} ({reviewQueueStats.awaiting_revision})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('rejected')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                                        statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {t.rejectedTab} ({reviewQueueStats.rejected})
                                </button>
                            </div>

                            <div className={`mb-6 rounded-2xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <h4 className={`font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.reviewTimeline}</h4>
                                <div className={`hidden lg:grid lg:grid-cols-5 gap-3 mb-2 px-1 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    <div>{t.studentLabel}</div>
                                    <div>{isArabic ? 'المشروع' : 'Project'}</div>
                                    <div>{isArabic ? 'المرحلة' : 'Milestone'}</div>
                                    <div>{t.progressLabel}</div>
                                    <div>{isArabic ? 'المسار المعتمد' : 'Configured Path'}</div>
                                </div>
                                <div className="space-y-2">
                                    {isNewReviewQueue
                                        ? filteredReviewItems.map((row) => (
                                              <div
                                                  key={`timeline-sub-${row.submission_id}`}
                                                  className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}
                                              >
                                                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 text-sm">
                                                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{row.student_name}</p>
                                                      <p className={isDark ? 'text-slate-200' : 'text-gray-800'}>{row.project_title}</p>
                                                      <p className={isDark ? 'text-slate-200' : 'text-gray-700'}>{row.milestone_title}</p>
                                                      <div>
                                                          <p className="font-bold text-blue-600">{row.project_progress || 0}%</p>
                                                          <div className={`mt-1 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                                              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${row.project_progress || 0}%` }} />
                                                          </div>
                                                      </div>
                                                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{row.submission_status}</p>
                                                  </div>
                                              </div>
                                          ))
                                        : null}
                                </div>
                            </div>

                            {isNewReviewQueue ? (
                                filteredReviewItems.length === 0 ? (
                                    <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.emptySupervisor}</p>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredReviewItems.map((row) => (
                                            <div
                                                key={`sub-${row.submission_id}`}
                                                className={`group relative p-5 rounded-2xl border shadow-sm transition-all ${
                                                    isDark
                                                        ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
                                                        : 'border-gray-200 bg-gray-50/70 hover:bg-white'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{row.project_title}</p>
                                                    <span className={statusBadgeClass(row.submission_status === 'reviewed' ? 'approved' : row.submission_status === 'needs_revision' ? 'awaiting_revision' : 'pending_action')}>
                                                        {row.submission_status}
                                                    </span>
                                                    {row.file_path ? (
                                                        <a href={`/storage/${row.file_path}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-semibold hover:underline">
                                                            {t.openFile}
                                                        </a>
                                                    ) : null}
                                                </div>
                                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                    {t.studentLabel}: {row.student_name} · {isArabic ? 'الفريق' : 'Team'}: {row.team_name}
                                                </p>
                                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                    {isArabic ? 'المرحلة' : 'Milestone'}: {row.milestone_title}
                                                </p>
                                                <p className="text-sm text-green-600">
                                                    {t.progressLabel}: {row.project_progress ?? 0}%
                                                </p>

                                                <textarea
                                                    value={commentsById[row.submission_id] || ''}
                                                    onChange={(e) =>
                                                        setCommentsById((prev) => ({
                                                            ...prev,
                                                            [row.submission_id]: e.target.value,
                                                        }))
                                                    }
                                                    className={`mt-3 w-full rounded-xl text-sm ${
                                                        isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-gray-300 bg-white text-gray-800'
                                                    }`}
                                                    rows="3"
                                                    placeholder={t.notePlaceholder}
                                                />

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => router.patch(route('supervisor.submissions.decide', row.submission_id), { decision: 'approve', notes: commentsById[row.submission_id] || null }, { preserveScroll: true })}
                                                        className="sr-btn-action h-9 w-auto px-3 text-xs bg-green-600 text-white hover:bg-green-700"
                                                    >
                                                        {t.approve}
                                                    </button>
                                                    <button
                                                        onClick={() => router.patch(route('supervisor.submissions.decide', row.submission_id), { decision: 'revise', notes: commentsById[row.submission_id] || null }, { preserveScroll: true })}
                                                        className="sr-btn-action-primary h-9 w-auto px-3 text-xs"
                                                    >
                                                        {t.requestChanges}
                                                    </button>
                                                    <button
                                                        onClick={() => router.patch(route('supervisor.submissions.decide', row.submission_id), { decision: 'reject', notes: commentsById[row.submission_id] || null }, { preserveScroll: true })}
                                                        className="sr-btn-action-danger h-9 w-auto px-3 text-xs"
                                                    >
                                                        {t.reject}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : filteredChallenges.length === 0 ? (
                                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.emptySupervisor}</p>
                            ) : (
                                <div className="space-y-4">
                                    {filteredChallenges.map((project) => (
                                        <div
                                            key={project.id}
                                            className={`group relative p-5 rounded-2xl border shadow-sm transition-all ${
                                                isDark
                                                    ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
                                                    : 'border-gray-200 bg-gray-50/70 hover:bg-white'
                                            }`}
                                        >
                                            <div className="absolute start-3 top-3 opacity-0 group-hover:opacity-100 transition-all">
                                                <div className={`inline-flex items-center gap-1.5 rounded-xl border p-1.5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                                    <button
                                                        onClick={() => updateProjectDecision(project.id, 'approve')}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                                                        title={t.quickApprove}
                                                    >
                                                        <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                                    </button>
                                                    <Link
                                                        href={
                                                            quickChatByStudentId[String(project.posted_by_user_id || project.postedBy?.id)] ||
                                                            route('supervisor.groups.index')
                                                        }
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700"
                                                        title={t.quickChat}
                                                    >
                                                        <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                                                    </Link>
                                                    {project.file_path && (
                                                        <a
                                                            href={`/storage/${project.file_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-slate-700 text-white text-xs hover:bg-slate-800"
                                                            title={t.quickView}
                                                        >
                                                            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => setActiveAi({ projectId: project.id, data: parseAiFeedback(project) })}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                                                        type="button"
                                                        title={`${t.aiSummaryBtn}${isArabic ? ' — تحليل AI' : ' — AI insights'}`}
                                                    >
                                                        <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden />
                                                        <span className="sr-only">{t.aiSummaryBtn}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{project.title}</p>
                                                <span className={statusBadgeClass(project.review_status || 'pending_action')}>
                                                    {statusLabel(project.review_status || 'pending_action')}
                                                </span>
                                                {project.file_path && (
                                                    <a
                                                        href={`/storage/${project.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm text-blue-600 font-semibold hover:underline"
                                                    >
                                                        {t.openFile}
                                                    </a>
                                                )}
                                            </div>
                                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.studentLabel}: {project.posted_by?.name || project.postedBy?.name || (isArabic ? 'غير معروف' : 'Unknown')}
                                            </p>
                                            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.currentMilestone}: {project.current_milestone}
                                            </p>
                                            <p className="text-sm text-green-600">
                                                {t.progressLabel}: {project.progress ?? 0}%
                                            </p>

                                            <div className="mt-3">
                                                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                                    {t.selectMilestone}
                                                </label>
                                                {(() => {
                                                    const sid = String(project.posted_by_user_id || project.postedBy?.id || '');
                                                    const options = milestoneOptionsByStudentId?.[sid] || [];
                                                    const fallback = [
                                                        { id: 'default:idea', label: t.milestoneIdea, progress: 10 },
                                                        { id: 'default:analysis', label: t.milestoneAnalysis, progress: 40 },
                                                        { id: 'default:implementation', label: t.milestoneImplementation, progress: 70 },
                                                        { id: 'default:final', label: t.milestoneFinal, progress: 100 },
                                                    ];
                                                    const finalOptions = options.length > 0 ? options : fallback;
                                                    const selected = finalOptions.find((x) => String(x.id) === String(milestoneById[project.id])) || finalOptions[0];
                                                    return (
                                                        <>
                                                            <select
                                                                value={milestoneById[project.id] || selected?.id}
                                                                onChange={(e) =>
                                                                    setMilestoneById((prev) => ({
                                                                        ...prev,
                                                                        [project.id]: e.target.value,
                                                                    }))
                                                                }
                                                                className={`mt-1 w-full rounded-lg text-sm ${
                                                                    isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-gray-300 bg-white text-gray-800'
                                                                }`}
                                                            >
                                                                {finalOptions.map((m) => (
                                                                    <option key={m.id} value={m.id}>
                                                                        {m.label} ({m.progress}%){m.deadline ? ` - ${m.deadline}` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {selected?.submission_title && (
                                                                <p className={`mt-1 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                    {isArabic ? 'عنوان التسليم: ' : 'Submission title: '}{selected.submission_title}
                                                                </p>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            <textarea
                                                value={commentsById[project.id] || ''}
                                                onChange={(e) =>
                                                    setCommentsById((prev) => ({
                                                        ...prev,
                                                        [project.id]: e.target.value,
                                                    }))
                                                }
                                                className={`mt-3 w-full rounded-xl text-sm ${
                                                    isDark
                                                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                                                        : 'border-gray-300 bg-white text-gray-800'
                                                }`}
                                                rows="3"
                                                placeholder={t.notePlaceholder}
                                            />

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => updateProjectDecision(project.id, 'approve')}
                                                    className="sr-btn-action h-9 md:h-9 w-auto px-3 text-xs bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    {t.approve}
                                                </button>
                                                <button
                                                    onClick={() => updateProjectDecision(project.id, 'revise')}
                                                    className="sr-btn-action-primary h-9 md:h-9 w-auto px-3 text-xs"
                                                >
                                                    {t.requestChanges}
                                                </button>
                                                <button
                                                    onClick={() => updateProjectDecision(project.id, 'reject')}
                                                    className="sr-btn-action-danger h-9 md:h-9 w-auto px-3 text-xs"
                                                >
                                                    {t.reject}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {isStudent && isModalOpen && (
                        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className={`rounded-3xl p-8 max-w-lg w-full shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.modalTitle}</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={submit} className="space-y-5">
                                    <div>
                                        <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.ideaTitle}</label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className={`w-full rounded-xl shadow-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-gray-200'}`}
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.summary}</label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className={`w-full rounded-xl shadow-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-gray-200'}`}
                                            rows="3"
                                        />
                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                    </div>

                                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center ${isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                        <input type="file" id="file-upload" onChange={(e) => setData('file', e.target.files[0])} className="hidden" />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-600'}`}>{data.file ? data.file.name : t.chooseFile}</span>
                                        </label>
                                        {errors.file && <p className="text-red-500 text-xs mt-2">{errors.file}</p>}
                                    </div>

                                    {progress && (
                                        <div className={`w-full rounded-full h-2 mt-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress.percentage}%` }} />
                                        </div>
                                    )}

                                    <button type="submit" className="sr-btn-action-primary h-14 text-base font-black disabled:bg-gray-400" disabled={processing}>
                                        {processing ? t.uploading : t.submit}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {activeAi && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-2xl rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.aiModalTitle}</h4>
                            <button onClick={() => setActiveAi(null)} className="text-sm text-red-500">✕</button>
                        </div>
                        {!activeAi.data ? (
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{isArabic ? 'لا يوجد تحليل AI لهذا التسليم بعد.' : 'No AI analysis available for this submission yet.'}</p>
                        ) : (
                            <div className="space-y-4">
                                <div className={`rounded-lg border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-violet-50 border-violet-100'}`}>
                                    <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-violet-700'}`}>{t.qualityScore}</p>
                                    <p className="text-2xl font-black text-violet-600">{activeAi.data.quality_score ?? '-'}/100</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{isArabic ? 'ملخص سريع' : 'Quick Summary'}</p>
                                    <ul className="list-disc ps-5 space-y-1 text-sm">
                                        {(activeAi.data.summary || []).map((s, idx) => (
                                            <li key={idx} className={isDark ? 'text-slate-200' : 'text-gray-700'}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{isArabic ? 'اقتراحات للمشرف' : 'Suggestions for Supervisor'}</p>
                                    <ul className="list-disc ps-5 space-y-1 text-sm">
                                        {(activeAi.data.suggestions || []).map((s, idx) => (
                                            <li key={idx} className={isDark ? 'text-slate-200' : 'text-gray-700'}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
