import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/ui/StatCard';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, Briefcase, FolderClock, FolderMinus, FolderX, Gauge, UserCog, UsersRound } from 'lucide-react';
import { useMemo } from 'react';

function formatWhen(iso, isArabic) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return isArabic ? d.toLocaleString('ar') : d.toLocaleString();
    } catch {
        return '';
    }
}

export default function HoDashboard({ preview = {} }) {
    const { isArabic, isDark } = useUiPreferences();

    const panel = preview.panel ?? {};
    const monitor = preview.monitor ?? {};
    const notif = preview.notifications ?? {};
    const notifPreview = notif.preview ?? [];

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'لوحة التحكم',
                      subtitle: 'نظرة سريعة على لوحة رئيس القسم، مراقبة الفرق، والإشعارات.',
                      hodPanel: 'لوحة رئيس القسم',
                      teamsMonitor: 'مراقبة الفرق',
                      notifications: 'الإشعارات',
                      openFull: 'فتح الصفحة كاملة',
                      pendingTeams: 'فرق بانتظار الاعتماد',
                      approvedTeams: 'فرق معتمدة',
                      rejectedTeams: 'فرق مرفوضة',
                      supervisors: 'المشرفون',
                      recentPending: 'أحدث طلبات الاعتماد',
                      none: 'لا يوجد',
                      teamsTotal: 'إجمالي الفرق',
                      withProject: 'مع مشروع',
                      withoutProject: 'بدون مشروع',
                      avgPreview: 'متوسط المعاينة',
                      recentProgress: 'أحدث التقدم',
                      feedPreview: 'معاينة الإشعارات',
                      noNotifications: 'لا توجد عناصر في المعاينة (لا فرق معلقة للاعتماد).',
                      teamApproval: 'اعتماد فريق',
                  }
                : {
                      title: 'Dashboard',
                      subtitle: 'Quick overview of your HoD panel, teams monitor, and notifications.',
                      hodPanel: 'HoD Panel',
                      teamsMonitor: 'Teams Monitor',
                      notifications: 'Notifications',
                      openFull: 'Open full page',
                      pendingTeams: 'Teams pending approval',
                      approvedTeams: 'Approved teams',
                      rejectedTeams: 'Rejected teams',
                      supervisors: 'Supervisors',
                      recentPending: 'Recent pending',
                      none: 'None',
                      teamsTotal: 'Total teams',
                      withProject: 'With a project',
                      withoutProject: 'Without project',
                      avgPreview: 'Avg. (preview)',
                      recentProgress: 'Recent progress',
                      feedPreview: 'Notification preview',
                      noNotifications: 'Nothing to preview (no pending team approvals).',
                      teamApproval: 'Team approval',
                  },
        [isArabic],
    );

    const cardBase = `${isDark ? 'sr-card-dark border border-slate-700' : 'sr-card-light border border-gray-200'} rounded-2xl p-5 flex flex-col h-full min-h-[22rem]`;
    const sectionLabel = `text-[10px] font-bold uppercase tracking-wide mt-4 mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`;
    const previewSubtitle = `text-[10px] font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`;
    const linkBtn = `shrink-0 mt-auto w-full inline-flex justify-center items-center rounded-xl px-4 py-2.5 text-sm font-bold transition ${
        isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'
    }`;
    const statGrid = 'grid grid-cols-2 gap-x-3 gap-y-4';
    const listRegion = `flex-1 flex flex-col min-h-[6.5rem] ${isDark ? 'text-slate-300' : 'text-gray-700'}`;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.subtitle}</p>
                </div>
            }
        >
            <Head title={t.title} />
            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                        {/* HoD Panel preview */}
                        <div className={cardBase}>
                            <h3 className={`shrink-0 text-lg font-black leading-tight min-h-[1.75rem] ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.hodPanel}</h3>
                            <div className="mt-3 flex flex-1 flex-col min-h-0">
                                <div className={statGrid}>
                                    <StatCard
                                        icon={FolderClock}
                                        label={t.pendingTeams}
                                        value={panel.pending_team_count ?? 0}
                                        tone="amber"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                    <StatCard
                                        icon={UserCog}
                                        label={t.supervisors}
                                        value={panel.supervisor_count ?? 0}
                                        tone="navy"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                    <StatCard
                                        icon={BadgeCheck}
                                        label={t.approvedTeams}
                                        value={panel.approved_team_count ?? 0}
                                        tone="emerald"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                    <StatCard
                                        icon={FolderX}
                                        label={t.rejectedTeams}
                                        value={panel.rejected_team_count ?? 0}
                                        tone="red"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                </div>
                                <div className={listRegion}>
                                    <p className={sectionLabel}>{t.recentPending}</p>
                                    <ul className="text-sm space-y-1.5 flex-1">
                                        {(panel.pending_samples || []).length === 0 ? (
                                            <li className="text-sm opacity-70">{t.none}</li>
                                        ) : (
                                            panel.pending_samples.map((row) => (
                                                <li key={row.id} className="truncate text-sm">
                                                    · {row.name}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <Link href={route('hod.panel')} className={`${linkBtn} pt-4`}>
                                {t.openFull}
                            </Link>
                        </div>

                        {/* Teams monitor preview */}
                        <div className={cardBase}>
                            <h3 className={`shrink-0 text-lg font-black leading-tight min-h-[1.75rem] ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.teamsMonitor}</h3>
                            <div className="mt-3 flex flex-1 flex-col min-h-0">
                                <div className={statGrid}>
                                    <StatCard
                                        icon={UsersRound}
                                        label={t.teamsTotal}
                                        value={monitor.teams_total ?? 0}
                                        tone="navy"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                    <StatCard
                                        icon={Briefcase}
                                        label={t.withProject}
                                        value={monitor.teams_with_project ?? 0}
                                        tone="emerald"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                    <StatCard
                                        icon={FolderMinus}
                                        label={t.withoutProject}
                                        value={Math.max(0, (monitor.teams_total ?? 0) - (monitor.teams_with_project ?? 0))}
                                        tone="amber"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                    <StatCard
                                        icon={Gauge}
                                        label={t.avgPreview}
                                        value={
                                            (monitor.samples || []).length
                                                ? `${Math.round(
                                                      (monitor.samples || []).reduce((a, r) => a + (Number(r.progress) || 0), 0) /
                                                          (monitor.samples || []).length,
                                                  )}%`
                                                : '—'
                                        }
                                        tone="blue"
                                        isDark={isDark}
                                        compact
                                        className="min-w-0"
                                    />
                                </div>
                                <div className={listRegion}>
                                    <p className={sectionLabel}>{t.recentProgress}</p>
                                    <ul className="text-sm space-y-2 flex-1">
                                        {(monitor.samples || []).length === 0 ? (
                                            <li className="text-sm opacity-70">{t.none}</li>
                                        ) : (
                                            monitor.samples.map((row, idx) => (
                                                <li
                                                    key={`${row.team_name}-${idx}`}
                                                    className={`flex items-center justify-between gap-3 text-sm leading-none ${isDark ? 'text-slate-200' : 'text-gray-800'}`}
                                                >
                                                    <span className="min-w-0 truncate font-semibold">{row.team_name}</span>
                                                    <span className="flex shrink-0 items-center gap-1.5 tabular-nums text-sm font-medium">
                                                        <span>{row.progress ?? 0}%</span>
                                                        <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-gray-400'}`} aria-hidden>
                                                            ·
                                                        </span>
                                                        <span className="max-w-[7.5rem] truncate">{row.project_title || '—'}</span>
                                                    </span>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <Link href={route('hod.teams.monitor')} className={`${linkBtn} pt-4`}>
                                {t.openFull}
                            </Link>
                        </div>

                        {/* Notifications preview */}
                        <div className={cardBase}>
                            <h3 className={`shrink-0 text-lg font-black leading-tight min-h-[1.75rem] ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.notifications}</h3>
                            <div className="mt-3 flex flex-1 flex-col min-h-0">
                                <p className={previewSubtitle}>{t.feedPreview}</p>
                                <div className={listRegion}>
                                    <ul className="text-sm space-y-2 flex-1">
                                        {notifPreview.length === 0 ? (
                                            <li className="text-sm opacity-70 leading-snug">{t.noNotifications}</li>
                                        ) : (
                                            notifPreview.map((row, idx) => (
                                                <li key={idx} className={`rounded-lg p-2.5 ${isDark ? 'bg-slate-800/80' : 'bg-gray-50'}`}>
                                                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                                                        {row.title || t.teamApproval}
                                                    </p>
                                                    <p className="text-xs mt-1 leading-snug">{row.message}</p>
                                                    {row.sent_at ? (
                                                        <p className={`text-[10px] mt-1.5 tabular-nums ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                            {formatWhen(row.sent_at, isArabic)}
                                                        </p>
                                                    ) : null}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <Link href={route('notifications.index')} className={`${linkBtn} pt-4`}>
                                {t.openFull}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
