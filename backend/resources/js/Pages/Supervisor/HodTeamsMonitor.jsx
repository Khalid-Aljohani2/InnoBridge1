import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function statusLabel(status, t) {
    if (status === 'approved') return t.approved;
    if (status === 'rejected') return t.rejected;
    return t.pending;
}

function milestoneStatusClass(status, isDark) {
    if (status === 'approved') return isDark ? 'bg-emerald-900/50 text-emerald-200' : 'bg-emerald-100 text-emerald-800';
    if (status === 'rejected') return isDark ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800';
    return isDark ? 'bg-slate-700 text-slate-200' : 'bg-gray-200 text-gray-800';
}

export default function HodTeamsMonitor({ teams = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [supervisorFilter, setSupervisorFilter] = useState('all');
    const [sortMode, setSortMode] = useState('progress_desc');

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'مراقبة الفرق',
                      desc: 'عرض للقراءة فقط: حالة الفرق والمشرفين وتقدم المشروع وطلبات التحديات في القسم.',
                      readOnly: 'للاطلاع فقط',
                      noTeams: 'لا توجد فرق ضمن النطاق الحالي.',
                      members: 'الأعضاء',
                      leader: 'القائد',
                      supervisor: 'المشرف',
                      dept: 'القسم',
                      teamStatus: 'حالة اعتماد الفريق',
                      project: 'المشروع',
                      progress: 'نسبة الإنجاز',
                      plan: 'خطة المراحل',
                      industryCh: 'تحدي الصناعة',
                      milestones: 'المراحل',
                      challengeReq: 'طلبات التحديات',
                      none: '—',
                      approved: 'معتمدة',
                      pending: 'معلقة',
                      rejected: 'مرفوضة',
                      searchPlaceholder: 'ابحث باسم الفريق أو القائد أو المشرف...',
                      filterStatus: 'فلتر الحالة',
                      filterSupervisor: 'فلتر المشرف',
                      all: 'الكل',
                      withSupervisor: 'مع مشرف',
                      withoutSupervisor: 'بدون مشرف',
                      sortBy: 'الترتيب',
                      sortProgressDesc: 'الأعلى تقدماً',
                      sortProgressAsc: 'الأقل تقدماً',
                      sortName: 'الاسم',
                  }
                : {
                      title: 'Teams Monitor',
                      desc: 'Read-only overview of teams, supervisors, project progress, and challenge requests in your scope.',
                      readOnly: 'Read-only',
                      noTeams: 'No teams in the current scope.',
                      members: 'Members',
                      leader: 'Leader',
                      supervisor: 'Supervisor',
                      dept: 'Department',
                      teamStatus: 'Team approval',
                      project: 'Project',
                      progress: 'Progress',
                      plan: 'Milestone plan',
                      industryCh: 'Industry challenge',
                      milestones: 'Milestones',
                      challengeReq: 'Challenge requests',
                      none: '—',
                      approved: 'Approved',
                      pending: 'Pending',
                      rejected: 'Rejected',
                      searchPlaceholder: 'Search by team, leader, or supervisor...',
                      filterStatus: 'Status filter',
                      filterSupervisor: 'Supervisor filter',
                      all: 'All',
                      withSupervisor: 'With supervisor',
                      withoutSupervisor: 'Without supervisor',
                      sortBy: 'Sort by',
                      sortProgressDesc: 'Highest progress',
                      sortProgressAsc: 'Lowest progress',
                      sortName: 'Name',
                  },
        [isArabic],
    );

    const filteredTeams = useMemo(() => {
        const term = search.trim().toLowerCase();
        let rows = teams.filter((team) => {
            const status = String(team.review_status || 'pending');
            if (statusFilter !== 'all' && status !== statusFilter) return false;

            const hasSupervisor = Boolean(team.supervisor?.id);
            if (supervisorFilter === 'with_supervisor' && !hasSupervisor) return false;
            if (supervisorFilter === 'without_supervisor' && hasSupervisor) return false;

            if (!term) return true;
            const haystack = [
                team.name,
                team.leader?.name,
                team.supervisor?.name,
                team.department,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(term);
        });

        rows = [...rows].sort((a, b) => {
            const ap = Number(a?.project?.current_progress || 0);
            const bp = Number(b?.project?.current_progress || 0);
            if (sortMode === 'progress_asc') return ap - bp;
            if (sortMode === 'name') return String(a?.name || '').localeCompare(String(b?.name || ''));
            return bp - ap;
        });

        return rows;
    }, [teams, search, statusFilter, supervisorFilter, sortMode]);

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
                    <div
                        className={`rounded-xl px-4 py-2 text-sm font-semibold w-fit ${isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}
                    >
                        {t.readOnly}
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.searchPlaceholder}
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                            >
                                <option value="all">{t.filterStatus}: {t.all}</option>
                                <option value="approved">{t.approved}</option>
                                <option value="pending">{t.pending}</option>
                                <option value="rejected">{t.rejected}</option>
                            </select>
                            <select
                                value={supervisorFilter}
                                onChange={(e) => setSupervisorFilter(e.target.value)}
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                            >
                                <option value="all">{t.filterSupervisor}: {t.all}</option>
                                <option value="with_supervisor">{t.withSupervisor}</option>
                                <option value="without_supervisor">{t.withoutSupervisor}</option>
                            </select>
                            <select
                                value={sortMode}
                                onChange={(e) => setSortMode(e.target.value)}
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                            >
                                <option value="progress_desc">{t.sortBy}: {t.sortProgressDesc}</option>
                                <option value="progress_asc">{t.sortBy}: {t.sortProgressAsc}</option>
                                <option value="name">{t.sortBy}: {t.sortName}</option>
                            </select>
                        </div>
                    </div>

                    {filteredTeams.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6 text-center ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noTeams}</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTeams.map((team) => {
                                const project = team.project;
                                const industryChallenge = project?.industry_challenge || project?.industryChallenge;
                                const crs = team.challenge_requests || team.challengeRequests || [];
                                return (
                                <div
                                    key={team.id}
                                    className={`rounded-xl border p-5 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.name}</p>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.members}: {team.members_count ?? 0} · {t.leader}: {team.leader?.name || t.none} · {t.supervisor}:{' '}
                                                {team.supervisor?.name || t.none}
                                            </p>
                                            {team.department ? (
                                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {t.dept}: {team.department}
                                                </p>
                                            ) : null}
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.teamStatus}: {statusLabel(team.review_status || 'pending', t)}
                                            </p>
                                        </div>
                                        {project ? (
                                            <div className={`text-end min-w-[140px] ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                                <p className="text-xs font-bold opacity-80">{t.progress}</p>
                                                <p className="text-2xl font-black">{Math.min(100, Math.max(0, Number(project.current_progress) || 0))}%</p>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                        <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-900/60 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                                            <p className="text-xs font-bold mb-1 opacity-80">{t.project}</p>
                                            <p className="text-sm font-semibold">{project?.title || t.none}</p>
                                            {industryChallenge ? (
                                                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                    {t.industryCh}: {industryChallenge.title}
                                                </p>
                                            ) : null}
                                            {(project?.milestone_plan || project?.milestonePlan) ? (
                                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                    {t.plan}: {(project.milestone_plan || project.milestonePlan).name}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-900/60 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                                            <p className="text-xs font-bold mb-2 opacity-80">{t.challengeReq}</p>
                                            {crs.length === 0 ? (
                                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.none}</p>
                                            ) : (
                                                <ul className="space-y-1.5">
                                                    {crs.map((cr) => {
                                                        const crIc = cr.industry_challenge || cr.industryChallenge;
                                                        return (
                                                        <li key={cr.id} className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                                            <span className="font-semibold">{crIc?.title || 'Challenge'}</span>
                                                            {' · '}
                                                            <span>{cr.status || 'pending'}</span>
                                                            {cr.supervisor?.name ? ` · ${cr.supervisor.name}` : ''}
                                                        </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {(project?.milestones?.length > 0) ? (
                                        <div className="mt-3">
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t.milestones}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {project.milestones.map((m) => (
                                                    <span
                                                        key={m.id}
                                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${milestoneStatusClass(m.status, isDark)}`}
                                                    >
                                                        <span className="opacity-90">{m.sequence}.</span>
                                                        {m.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
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
