import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Team({
    team = null,
    pendingInvitations = [],
    availableTeams = [],
    teamJoinEnabled = true,
    hasStudentIdeaUploaded = false,
}) {
    const { flash, auth } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [identifier, setIdentifier] = useState('');
    const [teamSearch, setTeamSearch] = useState('');
    const [onlyWithSeats, setOnlyWithSeats] = useState(true);
    const [onlyMyDepartment, setOnlyMyDepartment] = useState(true);
    const [sortMode, setSortMode] = useState('fewest_members');

    const isLeader = team?.leader_id ? Number(team.leader_id) === Number(auth?.user?.id) : false;

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'فريقي (Team)',
                      desc: 'إنشاء فريق مشروع وإدارة الأعضاء قبل اختيار التحدي.',
                      noTeam: 'لا يوجد فريق بعد. قم بإنشاء فريقك.',
                      teamName: 'اسم الفريق',
                      create: 'إنشاء فريق',
                      creating: 'جاري الإنشاء...',
                      members: 'الأعضاء',
                      addMember: 'إضافة عضو (البريد أو الرقم الجامعي)',
                      invitations: 'دعوات الانضمام',
                      accept: 'قبول',
                      reject: 'رفض',
                      invitedBy: 'الدعوة من',
                      teamLabel: 'الفريق',
                      noInvites: 'لا توجد دعوات حالياً.',
                      openTeams: 'الفرق المتاحة للانضمام',
                      joinTeam: 'انضمام',
                      teamIsFull: 'مكتمل',
                      teamJoinClosed: 'الانضمام للفرق مغلق حالياً من قبل رئيس القسم.',
                      noOpenTeams: 'لا توجد فرق متاحة للانضمام حالياً.',
                      searchTeams: 'ابحث باسم الفريق أو القائد...',
                      seatsLeft: 'مقاعد متبقية',
                      filterWithSeats: 'فرق بها مقاعد',
                      filterMyDepartment: 'حسب قسمي',
                      sortBy: 'الترتيب',
                      sortFewestMembers: 'الأقل أعضاء',
                      sortMostMembers: 'الأكثر أعضاء',
                      sortName: 'الاسم',
                      add: 'إضافة',
                      leave: 'مغادرة الفريق',
                      leaderOnly: 'هذا الإجراء متاح لقائد الفريق فقط.',
                      nameRequired: 'اكتب اسم الفريق قبل الإنشاء.',
                      ideaRequiredBanner: 'يجب رفع فكرة المشروع من صفحة «رفع الملفات» قبل إنشاء فريق.',
                      goUploads: 'الذهاب لصفحة رفع الملفات',
                      supervisor: 'المشرف',
                      teamStatus: 'حالة اعتماد الفريق',
                      approved: 'معتمد',
                      pending: 'بانتظار اعتماد رئيس القسم',
                      rejected: 'مرفوض',
                      project: 'المشروع',
                      status: 'الحالة',
                      progress: 'التقدم',
                      milestonePlan: 'خطة المراحل',
                      planName: 'الخطة',
                      currentStage: 'المرحلة الحالية',
                      stageCompleted: 'مكتملة',
                      stageUpcoming: 'لم تبدأ بعد',
                      stageInReview: 'قيد المراجعة',
                      stageNeedsWork: 'تحتاج متابعة',
                      allMilestonesDone: 'تم إكمال جميع المراحل المعتمدة.',
                  }
                : {
                      title: 'My Team',
                      desc: 'Create a project team and manage members before selecting a challenge.',
                      noTeam: 'No team yet. Create your team.',
                      teamName: 'Team name',
                      create: 'Create team',
                      creating: 'Creating...',
                      members: 'Members',
                      addMember: 'Add member (email or university ID)',
                      invitations: 'Invitations',
                      accept: 'Accept',
                      reject: 'Reject',
                      invitedBy: 'Invited by',
                      teamLabel: 'Team',
                      noInvites: 'No invitations.',
                      openTeams: 'Open teams to join',
                      joinTeam: 'Join',
                      teamIsFull: 'Full',
                      teamJoinClosed: 'Team joining is currently closed by HoD.',
                      noOpenTeams: 'No open teams to join right now.',
                      searchTeams: 'Search by team or leader...',
                      seatsLeft: 'Seats left',
                      filterWithSeats: 'Has seats',
                      filterMyDepartment: 'My department',
                      sortBy: 'Sort by',
                      sortFewestMembers: 'Fewest members',
                      sortMostMembers: 'Most members',
                      sortName: 'Name',
                      add: 'Add',
                      leave: 'Leave team',
                      leaderOnly: 'Only the team leader can do this action.',
                      nameRequired: 'Enter a team name before creating.',
                      ideaRequiredBanner: 'Upload your project idea on the Uploads page before creating a team.',
                      goUploads: 'Go to Uploads',
                      supervisor: 'Supervisor',
                      teamStatus: 'Team approval status',
                      approved: 'Approved',
                      pending: 'Pending HoD approval',
                      rejected: 'Rejected',
                      project: 'Project',
                      status: 'Status',
                      progress: 'Progress',
                      milestonePlan: 'Milestone plan',
                      planName: 'Plan',
                      currentStage: 'Current stage',
                      stageCompleted: 'Done',
                      stageUpcoming: 'Not started',
                      stageInReview: 'In review',
                      stageNeedsWork: 'Needs follow-up',
                      allMilestonesDone: 'All milestones are completed.',
                  },
        [isArabic],
    );

    const milestones = team?.project?.milestones || [];

    const { currentMilestoneId, orderedMilestones } = useMemo(() => {
        const ordered = [...milestones].sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));
        const firstOpen = ordered.find((m) => m.status !== 'approved');
        return {
            orderedMilestones: ordered,
            currentMilestoneId: firstOpen ? firstOpen.id : null,
        };
    }, [milestones]);

    const stageLabel = (m) => {
        if (m.status === 'approved') return t.stageCompleted;
        if (m.status === 'in_review') return t.stageInReview;
        if (m.status === 'rejected') return t.stageNeedsWork;
        if (m.status === 'pending') return t.stageUpcoming;
        return m.status || '—';
    };

    const createForm = useForm({ name: '' });
    const addForm = useForm({ identifier: '' });

    const createTeam = (e) => {
        e.preventDefault();
        createForm.clearErrors();
        if (!hasStudentIdeaUploaded) {
            return;
        }
        const trimmed = String(createForm.data.name || '').trim();
        if (!trimmed) {
            createForm.setError('name', t.nameRequired);
            return;
        }
        createForm.setData('name', trimmed);
        createForm.post(route('student.team.create'), { preserveScroll: true });
    };

    const addMember = (e) => {
        e.preventDefault();
        addForm.setData('identifier', identifier);
        addForm.post(route('student.team.members.add'), {
            preserveScroll: true,
            onSuccess: () => setIdentifier(''),
        });
    };

    const leaveTeam = () => {
        router.post(route('student.team.leave'), {}, { preserveScroll: true });
    };

    const decideInvite = (inviteId, decision) => {
        router.patch(route('student.team.invitations.decide', inviteId), { decision }, { preserveScroll: true });
    };

    const joinTeam = (teamId) => {
        router.post(route('student.team.join', teamId), {}, { preserveScroll: true });
    };

    const filteredAvailableTeams = useMemo(() => {
        const term = teamSearch.trim().toLowerCase();
        const userDepartment = String(auth?.user?.department || '').trim().toLowerCase();

        let rows = availableTeams.filter((row) => {
            const membersCount = Number(row?.members_count || 0);
            const maxMembers = Number(row?.max_members || 4);
            if (onlyWithSeats && membersCount >= maxMembers) {
                return false;
            }
            if (onlyMyDepartment && userDepartment) {
                const teamDepartment = String(row?.department || '').trim().toLowerCase();
                if (!teamDepartment || teamDepartment !== userDepartment) {
                    return false;
                }
            }
            return true;
        });

        if (term) {
            rows = rows.filter((row) => {
                const teamName = String(row?.name || '').toLowerCase();
                const leaderName = String(row?.leader?.name || '').toLowerCase();
                return teamName.includes(term) || leaderName.includes(term);
            });
        }

        rows.sort((a, b) => {
            const aMembers = Number(a?.members_count || 0);
            const bMembers = Number(b?.members_count || 0);
            if (sortMode === 'most_members') return bMembers - aMembers;
            if (sortMode === 'name') return String(a?.name || '').localeCompare(String(b?.name || ''));
            return aMembers - bMembers;
        });

        return rows;
    }, [availableTeams, teamSearch, onlyWithSeats, onlyMyDepartment, sortMode, auth?.user?.department]);

    const hasDepartment = Boolean(String(auth?.user?.department || '').trim());

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

                    {pendingInvitations.length > 0 ? (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.invitations}</h3>
                            <div className="space-y-2">
                                {pendingInvitations.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className={`rounded-xl p-3 border flex flex-wrap items-center justify-between gap-3 ${
                                            isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                {t.teamLabel}: {inv.team?.name || '-'}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.invitedBy}: {inv.invitedBy?.name || '-'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => decideInvite(inv.id, 'accept')}
                                                className="sr-btn-action bg-green-600 text-white hover:bg-green-700 w-auto px-3 text-xs"
                                            >
                                                {t.accept}
                                            </button>
                                            <button onClick={() => decideInvite(inv.id, 'reject')} className="sr-btn-action-danger w-auto px-3 text-xs">
                                                {t.reject}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {!team ? (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                            <p className={`${isDark ? 'text-slate-200' : 'text-gray-700'} mb-4`}>{t.noTeam}</p>
                            {!hasStudentIdeaUploaded ? (
                                <div
                                    className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                                        isDark ? 'border-amber-500/50 bg-amber-950/40 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-950'
                                    }`}
                                >
                                    <p className="leading-relaxed">{t.ideaRequiredBanner}</p>
                                    <Link
                                        href={route('student.uploads')}
                                        className={`mt-2 inline-block font-bold underline decoration-2 underline-offset-2 ${
                                            isDark ? 'text-cyan-300' : 'text-blue-700'
                                        }`}
                                    >
                                        {t.goUploads}
                                    </Link>
                                </div>
                            ) : null}
                            <form onSubmit={createTeam} className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 flex flex-col gap-1">
                                    <input
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder={t.teamName}
                                        disabled={!hasStudentIdeaUploaded || createForm.processing}
                                        className={`w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'} ${!hasStudentIdeaUploaded ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                    <InputError message={createForm.errors.name} />
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing || !hasStudentIdeaUploaded}
                                    className="sr-btn-action-primary w-auto px-5 disabled:opacity-60 h-[42px] shrink-0 self-start"
                                >
                                    {createForm.processing ? t.creating : t.create}
                                </button>
                            </form>

                            <div className={`mt-6 border-t pt-4 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.openTeams}</h3>
                                {!teamJoinEnabled ? (
                                    <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{t.teamJoinClosed}</p>
                                ) : availableTeams.length === 0 ? (
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noOpenTeams}</p>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            value={teamSearch}
                                            onChange={(e) => setTeamSearch(e.target.value)}
                                            placeholder={t.searchTeams}
                                            className={`w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setOnlyWithSeats((v) => !v)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                    onlyWithSeats
                                                        ? 'bg-blue-600 text-white'
                                                        : isDark
                                                          ? 'bg-slate-800 text-slate-200 border border-slate-600'
                                                          : 'bg-white text-gray-700 border border-gray-300'
                                                }`}
                                            >
                                                {t.filterWithSeats}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!hasDepartment}
                                                onClick={() => setOnlyMyDepartment((v) => !v)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                    onlyMyDepartment
                                                        ? 'bg-indigo-600 text-white'
                                                        : isDark
                                                          ? 'bg-slate-800 text-slate-200 border border-slate-600'
                                                          : 'bg-white text-gray-700 border border-gray-300'
                                                } ${!hasDepartment ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {t.filterMyDepartment}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.sortBy}</span>
                                                <select
                                                    value={sortMode}
                                                    onChange={(e) => setSortMode(e.target.value)}
                                                    className={`rounded-lg text-xs ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                                >
                                                    <option value="fewest_members">{t.sortFewestMembers}</option>
                                                    <option value="most_members">{t.sortMostMembers}</option>
                                                    <option value="name">{t.sortName}</option>
                                                </select>
                                            </div>
                                        </div>
                                        {filteredAvailableTeams.length === 0 ? (
                                            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noOpenTeams}</p>
                                        ) : null}
                                        {filteredAvailableTeams.map((openTeam) => {
                                            const membersCount = Number(openTeam.members_count || 0);
                                            const maxMembers = Number(openTeam.max_members || 4);
                                            const isFull = membersCount >= maxMembers;
                                            const seatsLeft = Math.max(0, maxMembers - membersCount);
                                            return (
                                                <div
                                                    key={openTeam.id}
                                                    className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className={`font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                                            {openTeam.name}
                                                        </p>
                                                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                            {membersCount}/{maxMembers} · {openTeam.leader?.name || '-'} · {t.seatsLeft}: {seatsLeft}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => joinTeam(openTeam.id)}
                                                        disabled={isFull}
                                                        className={`w-auto px-3 text-xs ${isFull ? 'sr-btn-action-neutral opacity-60 cursor-not-allowed' : 'sr-btn-action-primary'}`}
                                                    >
                                                        {isFull ? t.teamIsFull : t.joinTeam}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.name}</h3>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.supervisor}: {team.supervisor?.name || '-'}
                                        </p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.teamStatus}:{' '}
                                            {team.review_status === 'approved'
                                                ? t.approved
                                                : team.review_status === 'rejected'
                                                  ? t.rejected
                                                  : t.pending}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                        <p className="text-gray-500">{t.project}</p>
                                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.project?.title || '-'}</p>
                                    </div>
                                    <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                        <p className="text-gray-500">{t.status}</p>
                                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.project?.status || '-'}</p>
                                    </div>
                                    <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                        <p className="text-gray-500">{t.progress}</p>
                                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.project?.current_progress ?? 0}%</p>
                                    </div>
                                </div>

                                {orderedMilestones.length > 0 ? (
                                    <div
                                        className={`mt-5 border-t pt-4 ${isDark ? 'border-slate-600/50' : 'border-gray-200'}`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <h4 className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.milestonePlan}</h4>
                                            {team.project?.milestonePlan?.name ? (
                                                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {t.planName}: {team.project.milestonePlan.name}
                                                </span>
                                            ) : null}
                                        </div>
                                        {!currentMilestoneId && orderedMilestones.every((m) => m.status === 'approved') ? (
                                            <p className={`text-xs mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{t.allMilestonesDone}</p>
                                        ) : null}
                                        <ol className="space-y-2">
                                            {orderedMilestones.map((m, idx) => {
                                                const isCurrent = currentMilestoneId !== null && Number(m.id) === Number(currentMilestoneId);
                                                const isDone = m.status === 'approved';
                                                return (
                                                    <li
                                                        key={m.id}
                                                        className={`rounded-xl border px-3 py-2.5 flex flex-wrap items-start justify-between gap-2 transition ${
                                                            isCurrent
                                                                ? isDark
                                                                    ? 'border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/40'
                                                                    : 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                                : isDone
                                                                  ? isDark
                                                                      ? 'border-emerald-800/60 bg-emerald-950/30'
                                                                      : 'border-emerald-200 bg-emerald-50/80'
                                                                  : isDark
                                                                    ? 'border-slate-600 bg-slate-900/50 opacity-90'
                                                                    : 'border-gray-200 bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span
                                                                    className={`text-[11px] font-bold tabular-nums ${isDark ? 'text-slate-500' : 'text-gray-500'}`}
                                                                >
                                                                    {idx + 1}.
                                                                </span>
                                                                <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{m.title}</p>
                                                                {isCurrent ? (
                                                                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                                                        {t.currentStage}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {m.description ? (
                                                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{m.description}</p>
                                                            ) : null}
                                                            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                {stageLabel(m)}
                                                                {m.due_date ? ` · ${m.due_date}` : ''}
                                                            </p>
                                                        </div>
                                                        {isDone ? (
                                                            <span className="text-lg shrink-0" aria-hidden>
                                                                ✓
                                                            </span>
                                                        ) : null}
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    </div>
                                ) : null}
                            </div>

                            <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <h3 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.members}</h3>
                                    {!isLeader ? (
                                        <span className="text-xs text-amber-600 font-bold">{t.leaderOnly}</span>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    {(team.members || []).map((m) => (
                                        <div key={m.id} className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                            <div className="min-w-0">
                                                <p className={`font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{m.user?.name || '-'}</p>
                                                <p className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{m.user?.email || ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isLeader ? (
                                    <form onSubmit={addMember} className="mt-4 flex flex-col sm:flex-row gap-3">
                                        <input
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            placeholder={t.addMember}
                                            className={`flex-1 rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <button disabled={addForm.processing} className="sr-btn-action-primary w-auto px-5 text-xs disabled:opacity-60">
                                            {t.add}
                                        </button>
                                    </form>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

