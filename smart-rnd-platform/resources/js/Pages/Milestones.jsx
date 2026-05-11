import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

function clampPercent(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    return Math.min(100, Math.max(0, x));
}

export default function Milestones({ myProject = null }) {
    const { isArabic, isDark } = useUiPreferences();

    const t = useMemo(
        () =>
            isArabic
                ? {
                      subtitle: 'تُحسب نسبة الإنجاز من أوزان المراحل التي وافق عليها المشرف بعد تسليم الملفات.',
                      milestone: 'المرحلة الحالية',
                      progress: 'نسبة الإنجاز',
                      noTeam: 'لم تنضم إلى فريق بعد. أنشئ فريقك أو انتظر الدعوة.',
                      noProject: 'لا يوجد مشروع معتمد للفريق بعد.',
                      noMilestones: 'لا توجد مراحل بعد — يحددها المشرف عند ربط خطة المراحل بالمشروع.',
                      allComplete: 'اكتملت جميع المراحل المعتمدة من المشرف.',
                      activePrefix: 'التركيز الآن على:',
                      legacyFallback: 'لم يتم رفع فكرة بعد',
                      accepted: 'معتمدة',
                      pending: 'بانتظار',
                      inReview: 'قيد المراجعة',
                      rejected: 'تحتاج تعديل',
                      unknown: '—',
                      weight: 'الوزن',
                      due: 'الاستحقاق',
                      milestonesTitle: 'المراحل',
                      goWorkspace: 'مساحة العمل',
                      goTeam: 'فريقي',
                      countLine: (a, b) => `مراحل معتمدة: ${a} من ${b}`,
                  }
                : {
                      subtitle: 'Progress is based on milestone weights your supervisor has approved after you submit files.',
                      milestone: 'Current milestone',
                      progress: 'Progress',
                      noTeam: 'You are not on a team yet. Create a team or accept an invitation.',
                      noProject: 'Your team does not have an approved project yet.',
                      noMilestones: 'No milestones yet — your supervisor links a milestone plan to the project.',
                      allComplete: 'All milestones have been approved by your supervisor.',
                      activePrefix: 'Current focus:',
                      legacyFallback: 'No idea uploaded yet',
                      accepted: 'Approved',
                      pending: 'Pending',
                      inReview: 'In review',
                      rejected: 'Needs revision',
                      unknown: '—',
                      weight: 'Weight',
                      due: 'Due',
                      milestonesTitle: 'Milestones',
                      goWorkspace: 'Workspace',
                      goTeam: 'My Team',
                      countLine: (a, b) => `Approved milestones: ${a} of ${b}`,
                  },
        [isArabic],
    );

    const progress = clampPercent(myProject?.progress ?? 0);
    const current = myProject?.current ?? {};
    const kind = current.kind ?? 'no_team';
    const milestones = myProject?.milestones ?? [];

    const milestoneLine = useMemo(() => {
        if (kind === 'legacy') {
            return current.legacy_label || t.legacyFallback;
        }
        if (kind === 'no_team') return t.noTeam;
        if (kind === 'no_project') return t.noProject;
        if (kind === 'no_milestones') return t.noMilestones;
        if (kind === 'all_complete') return t.allComplete;
        if (kind === 'active' && current.milestone_title) {
            return `${t.activePrefix} ${current.milestone_title}`;
        }
        return isArabic ? 'لم يتم تحديد مرحلة بعد' : 'No milestone selected yet';
    }, [kind, current.legacy_label, current.milestone_title, t, isArabic]);

    const statusLabel = (status) => {
        if (status === 'approved') return t.accepted;
        if (status === 'pending') return t.pending;
        if (status === 'in_review') return t.inReview;
        if (status === 'rejected') return t.rejected;
        return status || t.unknown;
    };

    const statusClass = (status) => {
        if (status === 'approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (status === 'in_review') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (status === 'rejected') return 'bg-amber-100 text-amber-900 border-amber-200';
        return isDark ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const showCounts = (myProject?.milestone_count ?? 0) > 0;
    const source = myProject?.source ?? 'no_team';

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl leading-tight ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'سجل المراحل' : 'Milestones Log'}</h2>}>
            <Head title={isArabic ? 'سجل المراحل' : 'Milestones Log'} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-12 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className={`p-8 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        {myProject?.project_title ? (
                            <p className={`text-sm font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{myProject.project_title}</p>
                        ) : null}
                        <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'الحالة الحالية للمشروع' : 'Current Project Status'}</h3>
                        <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.subtitle}</p>
                        <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mb-4`}>
                            {t.milestone}: {milestoneLine}
                        </p>

                        <div className={`w-full rounded-full h-4 overflow-hidden shadow-inner mb-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <div
                                className="bg-gradient-to-r from-blue-600 via-blue-400 to-green-400 h-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                            {t.progress}: {progress}%
                        </p>
                        {showCounts ? (
                            <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {t.countLine(myProject.approved_milestone_count ?? 0, myProject.milestone_count ?? 0)}
                            </p>
                        ) : null}

                        {source === 'team_project' || source === 'no_project' || source === 'no_team' || source === 'no_milestones' ? (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <Link href={route('student.workspace')} className="sr-btn-action-primary w-auto shrink-0">
                                    {t.goWorkspace}
                                </Link>
                                <Link
                                    href={route('student.team')}
                                    className={`inline-flex items-center justify-center h-11 md:h-12 rounded-xl px-4 text-sm font-bold border transition shrink-0 active:scale-[0.99] ${
                                        isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    {t.goTeam}
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {milestones.length > 0 ? (
                        <div className={`p-8 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                            <h4 className={`sr-subtitle mb-4 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.milestonesTitle}</h4>
                            <ul className="space-y-3">
                                {milestones.map((m) => (
                                    <li
                                        key={m.id}
                                        className={`rounded-xl border p-4 flex flex-wrap items-start justify-between gap-3 ${
                                            isDark ? 'border-slate-700 bg-slate-900/40' : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                {m.sequence}. {m.title}
                                            </p>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {t.weight}: {m.weight}% {m.due_date ? `· ${t.due}: ${m.due_date}` : ''}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${statusClass(m.status)}`}>{statusLabel(m.status)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
