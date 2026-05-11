import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function HodPanel({ supervisors = [], groups = [], teamJoinEnabled = true }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();

    const [assignSupervisorDraft, setAssignSupervisorDraft] = useState({});
    const [teamNotesById, setTeamNotesById] = useState({});

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'لوحة رئيس القسم (HoD)',
                      desc: 'إدارة المشرفين وتوزيع المجموعات وتعيين المشرفين ومتابعة تقدم المشاريع داخل القسم.',
                      supervisors: 'المشرفون',
                      groups: 'المجموعات (Teams)',
                      pendingTeams: 'مجموعات بانتظار الاعتماد',
                      approveTeam: 'اعتماد المجموعة',
                      rejectTeam: 'رفض المجموعة',
                      teamNotes: 'ملاحظات (اختياري)',
                      status: 'الحالة',
                      approved: 'معتمدة',
                      pending: 'بانتظار الاعتماد',
                      rejected: 'مرفوضة',
                      assignSupervisor: 'تعيين مشرف للمجموعة',
                      selectSupervisor: 'اختر مشرف',
                      assign: 'تعيين',
                      dismantle: 'تفكيك الفريق',
                      dismantleConfirm: 'هل أنت متأكد؟ سيتم حذف الفريق نهائياً مع المشروع والمحادثات.',
                      deleteSupervisor: 'تعطيل المشرف',
                      deleteSupervisorConfirm: 'هل أنت متأكد من تعطيل حساب هذا المشرف؟',
                      activateSupervisor: 'إعادة تفعيل',
                      activateSupervisorConfirm: 'هل تريد إعادة تفعيل حساب هذا المشرف؟',
                      active: 'نشط',
                      inactive: 'معطل',
                      teamJoinControl: 'التحكم بانضمام الطلاب للفرق',
                      teamJoinEnabled: 'مفتوح',
                      teamJoinDisabled: 'مغلق',
                      enableJoin: 'فتح الانضمام',
                      disableJoin: 'إغلاق الانضمام',
                  }
                : {
                      title: 'HoD Panel',
                      desc: 'Manage supervisors, assign teams, and monitor project progress within the department.',
                      supervisors: 'Supervisors',
                      groups: 'Groups (Teams)',
                      pendingTeams: 'Teams pending approval',
                      approveTeam: 'Approve team',
                      rejectTeam: 'Reject team',
                      teamNotes: 'Notes (optional)',
                      status: 'Status',
                      approved: 'Approved',
                      pending: 'Pending',
                      rejected: 'Rejected',
                      assignSupervisor: 'Assign supervisor to group',
                      selectSupervisor: 'Select supervisor',
                      assign: 'Assign',
                      dismantle: 'Dismantle team',
                      dismantleConfirm: 'Are you sure? This will permanently delete the team, its project, and chats.',
                      deleteSupervisor: 'Disable supervisor',
                      deleteSupervisorConfirm: 'Are you sure you want to disable this supervisor account?',
                      activateSupervisor: 'Reactivate',
                      activateSupervisorConfirm: 'Do you want to reactivate this supervisor account?',
                      active: 'Active',
                      inactive: 'Inactive',
                      teamJoinControl: 'Student team join control',
                      teamJoinEnabled: 'Open',
                      teamJoinDisabled: 'Closed',
                      enableJoin: 'Enable Join',
                      disableJoin: 'Disable Join',
                  },
        [isArabic],
    );

    const assignSupervisor = (teamId) => {
        const supervisor_id = assignSupervisorDraft[teamId];
        if (!supervisor_id) return;
        router.patch(route('hod.groups.assign-supervisor', teamId), { supervisor_id }, { preserveScroll: true });
    };

    const reviewTeam = (teamId, decision) => {
        router.patch(
            route('hod.teams.review', teamId),
            { decision, notes: teamNotesById[teamId] || null },
            { preserveScroll: true },
        );
    };

    const dismantleTeam = (teamId) => {
        if (!window.confirm(t.dismantleConfirm)) return;
        router.delete(route('hod.teams.dismantle', teamId), { preserveScroll: true });
    };

    const deleteSupervisor = (supervisorId) => {
        if (!window.confirm(t.deleteSupervisorConfirm)) return;
        router.delete(route('hod.supervisors.delete', supervisorId), { preserveScroll: true });
    };

    const activateSupervisor = (supervisorId) => {
        if (!window.confirm(t.activateSupervisorConfirm)) return;
        router.patch(route('hod.supervisors.activate', supervisorId), {}, { preserveScroll: true });
    };

    const toggleTeamJoin = (enabled) => {
        router.patch(route('hod.team-join.toggle'), { enabled }, { preserveScroll: true });
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

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.teamJoinControl}</h3>
                            <div className="flex items-center justify-between gap-3">
                                <p className={`text-sm font-bold ${teamJoinEnabled ? 'text-emerald-600' : 'text-amber-700'}`}>
                                    {t.status}: {teamJoinEnabled ? t.teamJoinEnabled : t.teamJoinDisabled}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => toggleTeamJoin(!teamJoinEnabled)}
                                    className={`${teamJoinEnabled ? 'sr-btn-action-danger' : 'sr-btn-action-primary'} w-auto px-3 text-xs`}
                                >
                                    {teamJoinEnabled ? t.disableJoin : t.enableJoin}
                                </button>
                            </div>
                        </div>

                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.supervisors}</h3>
                            <div className="space-y-2">
                                {supervisors.map((s) => (
                                    <div key={s.id} className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{s.name}</p>
                                                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{s.email} · {s.role}</p>
                                                <p className={`text-xs mt-1 ${s.is_active ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {t.status}: {s.is_active ? t.active : t.inactive}
                                                </p>
                                            </div>
                                            {s.is_active ? (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteSupervisor(s.id)}
                                                    className="sr-btn-action-danger w-auto px-3 text-[11px]"
                                                >
                                                    {t.deleteSupervisor}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => activateSupervisor(s.id)}
                                                    className="sr-btn-action-primary w-auto px-3 text-[11px]"
                                                >
                                                    {t.activateSupervisor}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.groups}</h3>
                        <div className="space-y-3">
                            {groups.map((g) => (
                                <div key={g.id} className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className={`font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{g.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {isArabic ? 'الأعضاء' : 'Members'}: {g.members_count ?? '-'} · {isArabic ? 'المشرف' : 'Supervisor'}: {g.supervisor?.name || '-'}
                                            </p>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {t.status}:{' '}
                                                {g.review_status === 'approved'
                                                    ? t.approved
                                                    : g.review_status === 'rejected'
                                                      ? t.rejected
                                                      : t.pending}
                                            </p>
                                        </div>
                                        {(g.review_status || 'pending') === 'pending' && (
                                            <div className="flex flex-col gap-2 min-w-[220px]">
                                                <textarea
                                                    value={teamNotesById[g.id] || ''}
                                                    onChange={(e) => setTeamNotesById((p) => ({ ...p, [g.id]: e.target.value }))}
                                                    rows={2}
                                                    placeholder={t.teamNotes}
                                                    className={`w-full rounded-xl text-sm ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => reviewTeam(g.id, 'approve')}
                                                        className="sr-btn-action bg-green-600 text-white hover:bg-green-700 w-auto px-3 text-xs"
                                                    >
                                                        {t.approveTeam}
                                                    </button>
                                                    <button onClick={() => reviewTeam(g.id, 'reject')} className="sr-btn-action-danger w-auto px-3 text-xs">
                                                        {t.rejectTeam}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-1 gap-3">
                                        <div className={`${isDark ? 'bg-slate-900/60' : 'bg-white'} rounded-xl p-3 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.assignSupervisor}</p>
                                            <div className="flex gap-2">
                                                <select
                                                    value={assignSupervisorDraft[g.id] || g.supervisor?.id || ''}
                                                    onChange={(e) => setAssignSupervisorDraft((p) => ({ ...p, [g.id]: e.target.value }))}
                                                    className={`flex-1 rounded-lg text-xs ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                                >
                                                    <option value="">{t.selectSupervisor}</option>
                                                    {supervisors.filter((s) => s.is_active).map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name} ({s.role})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button onClick={() => assignSupervisor(g.id)} className="sr-btn-action-primary w-auto px-3 text-xs">
                                                    {t.assign}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`${isDark ? 'bg-slate-900/60' : 'bg-white'} rounded-xl p-3 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.dismantle}</p>
                                            <button onClick={() => dismantleTeam(g.id)} className="sr-btn-action-danger w-auto px-3 text-xs">
                                                {t.dismantle}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

