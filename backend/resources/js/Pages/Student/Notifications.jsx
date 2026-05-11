import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

export default function StudentNotifications({ items = [] }) {
    const { isArabic, isDark } = useUiPreferences();

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'الإشعارات',
                      desc: 'كل ما يحدث في حسابك في مكان واحد (دعوات الفرق، رسائل المجموعات، قرارات المشرف، وغيرها).',
                      empty: 'لا توجد إشعارات حتى الآن.',
                      open: 'فتح',
                      unread: 'جديد',
                  }
                : {
                      title: 'Notifications',
                      desc: 'Everything happening in your account in one place (team invites, chat messages, supervisor decisions, and more).',
                      empty: 'No notifications yet.',
                      open: 'Open',
                      unread: 'New',
                  },
        [isArabic],
    );

    const iconFor = (kind) => {
        if (kind === 'team_invitation') return '👥';
        if (kind === 'group_chat') return '💬';
        if (kind === 'challenge_request') return '🏁';
        if (kind === 'submission_review') return '✅';
        return '🔔';
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
                    {items.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>{t.empty}</div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((n) => (
                                <div
                                    key={`${n.kind}-${n.id}`}
                                    className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-gray-200 bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{iconFor(n.kind)}</span>
                                                <p className={`font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{n.title}</p>
                                                {!n.is_read && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                                                        {t.unread}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{n.message}</p>
                                            {n.meta?.group ? (
                                                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{n.meta.group}</p>
                                            ) : null}
                                        </div>
                                        {n.link ? (
                                            <Link href={n.link} className="sr-btn-action-primary h-9 md:h-9 w-auto px-3 text-xs shrink-0">
                                                {t.open}
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

