import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/ui/StatCard';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ClipboardCheck, ClipboardList, CircleX, Hourglass, UsersRound } from 'lucide-react';

export default function SupervisorHome({ stats, teamsPreview = [], reviewPreview = [], recentNotifications, groupChatInbox = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const { flash } = usePage().props;
    const [teamQuery, setTeamQuery] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');

    const filteredTeams = useMemo(
        () =>
            teamsPreview.filter((t) =>
                (t.team_name || '')
                    .toLowerCase()
                    .includes(teamQuery.toLowerCase()),
            ),
        [teamsPreview, teamQuery],
    );

    const selectedTeam = useMemo(
        () => teamsPreview.find((t) => String(t.team_id) === String(selectedTeamId)),
        [teamsPreview, selectedTeamId],
    );

    const statusText = (status) => {
        if (status === 'approved') return isArabic ? 'مقبول' : 'Approved';
        if (status === 'rejected') return isArabic ? 'مرفوض' : 'Rejected';
        if (status === 'awaiting_revision') return isArabic ? 'بانتظار التعديل' : 'Awaiting Revision';
        return isArabic ? 'بانتظار إجراء' : 'Pending Action';
    };

    const milestoneText = (value) => {
        const text = String(value || '').trim();
        if (text === '') return '-';

        const arToEn = {
            'الفكرة - بانتظار/قيد التقييم': 'Idea - Under Review',
            'تحليل النظام': 'System Analysis',
            'مرحلة التنفيذ البرمجي': 'Implementation Stage',
            'الاعتماد النهائي': 'Final Approval',
            'الفكرة مرفوعة - بانتظار قرار المشرف': 'Idea submitted - Waiting for supervisor decision',
            'مقبول من المشرف - الفكرة - بانتظار/قيد التقييم': 'Approved by supervisor - Idea stage',
            'مقبول من المشرف - تحليل النظام': 'Approved by supervisor - Analysis stage',
            'مقبول من المشرف - مرحلة التنفيذ البرمجي': 'Approved by supervisor - Implementation stage',
            'مقبول من المشرف - الاعتماد النهائي': 'Approved by supervisor - Final stage',
            'مطلوب تعديل قبل الموافقة': 'Revision required before approval',
            'مرفوض من المشرف': 'Rejected by supervisor',
            'تم تعديل الملف من الطالب - بانتظار إعادة المراجعة': 'Student resubmitted changes - Waiting for re-review',
            'لم يتم رفع فكرة بعد': 'No idea uploaded yet',
        };

        const enToAr = Object.fromEntries(Object.entries(arToEn).map(([ar, en]) => [en, ar]));
        return isArabic ? enToAr[text] || text : arToEn[text] || text;
    };

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'الرئيسية - المشرف' : 'Supervisor Home'}</h2>}>
            <Head title={isArabic ? 'الرئيسية - المشرف' : 'Supervisor Home'} />

            <div id="overview-section" dir={isArabic ? 'rtl' : 'ltr'} className={`py-10 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && <div className="sr-alert-success">{flash.success}</div>}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <StatCard
                            icon={UsersRound}
                            label={isArabic ? 'إجمالي الطلبات' : 'Total Requests'}
                            value={stats.total}
                            tone="blue"
                            isDark={isDark}
                        />
                        <StatCard
                            icon={ClipboardCheck}
                            label={isArabic ? 'مقبولة' : 'Approved'}
                            value={stats.approved}
                            tone="emerald"
                            isDark={isDark}
                        />
                        <StatCard
                            icon={CircleX}
                            label={isArabic ? 'مرفوضة' : 'Rejected'}
                            value={stats.rejected}
                            tone="red"
                            isDark={isDark}
                        />
                        <StatCard
                            icon={Hourglass}
                            label={isArabic ? 'بانتظار إجراء' : 'Pending Action'}
                            value={stats.pending}
                            tone="amber"
                            isDark={isDark}
                        />
                        <StatCard
                            icon={ClipboardList}
                            label={isArabic ? 'بانتظار التعديل' : 'Awaiting Revision'}
                            value={stats.awaiting_revision || 0}
                            tone="violet"
                            isDark={isDark}
                        />
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                        <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {isArabic ? 'لوحة الفرق' : 'Teams Dashboard'}
                        </h3>
                        {/* RTL: grid columns flow right-to-left so actions sit on the visual left; LTR unchanged */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:items-end">
                            <input
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                placeholder={isArabic ? 'ابحث باسم الفريق' : 'Search team name'}
                                value={teamQuery}
                                onChange={(e) => setTeamQuery(e.target.value)}
                            />
                            <select
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                            >
                                <option value="">{isArabic ? 'اختر فريق' : 'Select team'}</option>
                                {filteredTeams.map((t) => (
                                    <option key={t.team_id} value={t.team_id}>
                                        {t.team_name} {isArabic ? `(بانتظار: ${t.pending_count})` : `(Pending: ${t.pending_count})`}
                                    </option>
                                ))}
                            </select>
                            <div className="flex w-full justify-end">
                                <Link
                                    href={route('supervisor.students')}
                                    className="sr-btn-action-primary max-w-xs text-center"
                                >
                                    {isArabic ? 'فتح لوحة الفرق' : 'Open Teams Page'}
                                </Link>
                            </div>
                        </div>

                        {selectedTeam && (
                            <div className={`mt-4 rounded-2xl p-5 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{selectedTeam.team_name}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                                            {(isArabic ? 'بانتظار' : 'Pending') + ': ' + (selectedTeam.pending_count ?? 0)}
                                        </span>
                                        <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">
                                            {(isArabic ? 'تعديل' : 'Needs rev.') + ': ' + (selectedTeam.awaiting_count ?? 0)}
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">
                                            {(isArabic ? 'مقبول' : 'Approved') + ': ' + (selectedTeam.approved_count ?? 0)}
                                        </span>
                                    </div>
                                </div>
                                <p className={`mt-3 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    {isArabic
                                        ? 'هذه الإحصائيات مبنية على أحدث التسليمات في لوحة المتابعة.'
                                        : 'These numbers are based on latest submissions in the tracking panel.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className={`sr-subtitle min-w-0 flex-1 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {isArabic ? 'لوحة المتابعة' : 'Tracking Panel'}
                            </h3>
                            <Link href={route('supervisor.requests')} className="sr-btn-action-primary max-w-xs shrink-0 text-center">
                                {isArabic ? 'فتح لوحة المتابعة' : 'Open Tracking Panel'}
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {reviewPreview.map((item) => (
                                <div key={item.submission_id} className={`rounded-xl px-4 py-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{item.team_name}</p>
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {isArabic ? 'الطالب' : 'Student'}: {item.student_name}{' '}
                                        <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>
                                            · {isArabic ? 'المهمة' : 'Milestone'}: {item.milestone_title}
                                        </span>
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        {isArabic ? 'آخر إرسال' : 'Last submitted'}: {item.submitted_at}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {isArabic ? 'الحالة' : 'Status'}: {statusText(item.submission_status)}
                                    </p>
                                </div>
                            ))}
                            {reviewPreview.length === 0 && (
                                <p className={`text-sm opacity-70 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {isArabic ? 'لا توجد تسليمات في لوحة المتابعة حالياً.' : 'No submissions in the tracking panel yet.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* justify-end: trailing edge — right in LTR, left in RTL (matches card padding via px-6) */}
                    <div className="flex items-center justify-end px-6">
                        <Link href={route('supervisor.groups.index')} className="sr-btn-action-secondary max-w-xs text-center">
                            {isArabic ? 'فتح محادثات المجموعات' : 'Open Group Chats'}
                        </Link>
                    </div>

                    {groupChatInbox.length > 0 && (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <h4 className={`font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {isArabic ? 'رسائل المجموعات' : 'Group chat messages'}
                            </h4>
                            <div className="space-y-2">
                                {groupChatInbox.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`rounded-lg p-3 flex flex-wrap items-start justify-between gap-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{n.title}</p>
                                            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{n.body}</p>
                                            <p className="text-xs text-purple-600 mt-1">
                                                {isArabic ? 'من' : 'From'}: {n.sender?.name}
                                                {n.group?.name ? ` · ${n.group.name}` : ''}
                                                {!n.is_read && (
                                                    <span className="ms-2 font-bold text-amber-600">{isArabic ? 'جديد' : 'New'}</span>
                                                )}
                                            </p>
                                        </div>
                                        <Link
                                            href={route('supervisor.groups.chat', n.supervisor_group_id)}
                                            className="sr-btn-action-primary shrink-0 px-3 py-1.5 text-xs"
                                        >
                                            {isArabic ? 'فتح المحادثة' : 'Open chat'}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div id="notifications-section" className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h4 className={`font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'آخر الإشعارات المستلمة' : 'Recent Received Messages'}</h4>
                        <div className="space-y-2">
                            {recentNotifications.map((n) => (
                                <div key={n.id} className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                    <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{n.title}</p>
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{n.message}</p>
                                    <p className="text-xs text-blue-600 mt-1">{isArabic ? 'إلى:' : 'To:'} {n.student?.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
