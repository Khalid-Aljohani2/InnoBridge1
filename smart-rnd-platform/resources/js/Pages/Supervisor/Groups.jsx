import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ListTodo, MessageSquare, UsersRound } from 'lucide-react';

export default function GroupsPage({ groups = [], assignedTeamCount = 0 }) {
    const { isArabic, isDark } = useUiPreferences();
    const { flash, auth } = usePage().props;
    const role = auth?.user?.role;
    const isSupervisor = role === 'supervisor';

    const t = isArabic
        ? {
              title: 'المجموعات والمحادثات الخاصة',
              groupsTitle: 'مجموعات المحادثة',
              noGroups: 'لا توجد مجموعات محادثة بعد.',
              noGroupsHint:
                  'بعد إسنادك لفريق من لوحة رئيس القسم، تُنشأ هنا محادثة «الفريق + المشرف» تلقائياً. إن لم تظهر، حدّث الصفحة أو افتح «المراحل» ليعاد المزامنة.',
              members: 'الأعضاء',
              myRole: 'صلاحيتي',
              adminRole: 'مسؤول',
              memberRole: 'عضو',
              latestMessage: 'آخر رسالة',
              openChat: 'دخول المحادثة',
              noMessage: 'لا توجد رسائل بعد.',
              kindTeam: 'فريق + مشرف',
              kindOther: 'مجموعة',
              quickTitle: 'اختصارات',
              quickStudents: 'فرق الطلاب',
              quickMilestones: 'خطط المراحل',
              statsAssigned: 'فرق مُسنَدة إليك',
              statsChats: 'محادثات ظاهرة هنا',
          }
        : {
              title: 'Groups & Private Chats',
              groupsTitle: 'Chat groups',
              noGroups: 'No chat groups yet.',
              noGroupsHint:
                  'When HoD assigns you to a team, a “team + supervisor” chat is created here automatically. Refresh this page or open Milestones once to sync if something is missing.',
              members: 'Members',
              myRole: 'My role',
              adminRole: 'Admin',
              memberRole: 'Member',
              latestMessage: 'Latest message',
              openChat: 'Open chat',
              noMessage: 'No messages yet.',
              kindTeam: 'Team + supervisor',
              kindOther: 'Group',
              quickTitle: 'Shortcuts',
              quickStudents: 'Student teams',
              quickMilestones: 'Milestone plans',
              statsAssigned: 'Teams assigned to you',
              statsChats: 'Chats listed here',
          };

    const kindLabel = (kind) =>
        kind === 'with_supervisor' || kind === undefined || kind === null ? t.kindTeam : t.kindOther;

    const QuickArrow = ({ className }) =>
        isArabic ? <ArrowLeft className={className} aria-hidden /> : <ArrowRight className={className} aria-hidden />;

    const quickLinkCls = `${isDark ? 'sr-card-dark border border-slate-700 hover:border-teal-500/40' : 'sr-card-light border border-gray-200 hover:border-teal-400/70'} rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors`;

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>}>
            <Head title={t.title} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && (
                        <div className="sr-alert-success">{flash.success}</div>
                    )}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    {isSupervisor && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 rounded-xl flex items-start gap-3`}>
                                <div className={`rounded-xl p-2 ${isDark ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>
                                    <UsersRound className="w-5 h-5" aria-hidden />
                                </div>
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {t.statsAssigned}
                                    </p>
                                    <p className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{assignedTeamCount}</p>
                                </div>
                            </div>
                            <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 rounded-xl flex items-start gap-3`}>
                                <div className={`rounded-xl p-2 ${isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
                                    <MessageSquare className="w-5 h-5" aria-hidden />
                                </div>
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {t.statsChats}
                                    </p>
                                    <p className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{groups.length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isSupervisor && (
                        <div>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.quickTitle}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Link href={route('supervisor.students')} className={quickLinkCls}>
                                    <span className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.quickStudents}</span>
                                    <QuickArrow className="w-4 h-4 shrink-0 text-teal-500" />
                                </Link>
                                <Link href={route('supervisor.milestones')} className={quickLinkCls}>
                                    <span className={`font-semibold text-sm inline-flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                        <ListTodo className="w-4 h-4 text-teal-500" aria-hidden />
                                        {t.quickMilestones}
                                    </span>
                                    <QuickArrow className="w-4 h-4 shrink-0 text-teal-500" />
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.groupsTitle}</h3>
                        {groups.length === 0 ? (
                            <div
                                className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center ${
                                    isDark ? 'border-slate-600 bg-slate-800/40' : 'border-gray-200 bg-gray-50/80'
                                }`}
                            >
                                <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} aria-hidden />
                                <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.noGroups}</p>
                                <p className={`text-sm mt-2 max-w-lg mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    {t.noGroupsHint}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {groups.map((group) => (
                                    <article
                                        key={group.id}
                                        className={`rounded-xl border p-4 flex flex-col gap-2 ${
                                            isDark ? 'border-slate-700 bg-slate-800/40' : 'border-gray-200 bg-gray-50/60'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className={`font-black flex-1 min-w-0 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{group.name}</h4>
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                                                    group.kind === 'with_supervisor'
                                                        ? isDark
                                                            ? 'bg-teal-500/20 text-teal-200'
                                                            : 'bg-teal-100 text-teal-800'
                                                        : isDark
                                                          ? 'bg-slate-600 text-slate-200'
                                                          : 'bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {kindLabel(group.kind)}
                                            </span>
                                        </div>
                                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                            {group.description || '—'}
                                        </p>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                                            {t.members}: {group.members_count}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.myRole}:{' '}
                                            <span
                                                className={`font-bold ${
                                                    group.user_group_role === 'admin'
                                                        ? isDark
                                                            ? 'text-emerald-400'
                                                            : 'text-emerald-600'
                                                        : isDark
                                                          ? 'text-slate-400'
                                                          : 'text-slate-600'
                                                }`}
                                            >
                                                {group.user_group_role === 'admin' ? t.adminRole : t.memberRole}
                                            </span>
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.latestMessage}:{' '}
                                            <span className="font-semibold line-clamp-2">
                                                {group.latest_message?.message || t.noMessage}
                                            </span>
                                        </p>
                                        <div className="mt-auto pt-2">
                                            <Link
                                                href={route('supervisor.groups.chat', group.id)}
                                                className="sr-btn-action-primary h-9 md:h-9 text-xs w-full sm:w-auto inline-flex justify-center"
                                            >
                                                {t.openChat}
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
