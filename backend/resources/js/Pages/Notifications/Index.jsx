import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function NotificationCenter({ items = [] }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const { isArabic, isDark } = useUiPreferences();
    const [search, setSearch] = useState('');

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'الإشعارات',
                      desc: 'كل ما يخص حسابك في مكان واحد.',
                      empty: 'لا توجد إشعارات حتى الآن.',
                      open: 'فتح',
                      unread: 'جديد',
                      search: 'ابحث في الإشعارات...',
                      markRead: 'تمييز كمقروء',
                      markAll: 'تمييز الكل كمقروء',
                  }
                : {
                      title: 'Notifications',
                      desc: 'Everything relevant to your account in one place.',
                      empty: 'No notifications yet.',
                      open: 'Open',
                      unread: 'New',
                      search: 'Search notifications...',
                      markRead: 'Mark read',
                      markAll: 'Mark all read',
                  },
        [isArabic],
    );

    const iconFor = (kind) => {
        if (kind === 'team_invitation') return '👥';
        if (kind === 'group_chat') return '💬';
        if (kind === 'challenge_request') return '🏁';
        if (kind === 'challenge_assigned') return '🏢';
        if (kind === 'submission_review') return '✅';
        if (kind === 'submission_pending') return '📦';
        if (kind === 'milestone_deadline') return '⏰';
        if (kind === 'team_review') return '🛡️';
        if (kind === 'supervisor') return '🧑‍🏫';
        return '🔔';
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return items;
        return items.filter((n) => {
            const hay = [n.title, n.message, n.meta?.sender, n.meta?.group, n.meta?.team, n.meta?.challenge].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(term);
        });
    }, [items, search]);

    const canMarkRead = (n) => {
        if (!n || n.is_read) return false;
        return [
            'group_chat',
            'supervisor',
            'team_invitation',
            'submission_review',
            'submission_pending',
            'milestone_deadline',
            'challenge_request',
            'team_review',
            'challenge_assigned',
        ].includes(n.kind);
    };

    const markOne = (n) => {
        if (!canMarkRead(n)) return;
        router.patch(route('notifications.read'), { items: [{ kind: n.kind, id: n.id }] }, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.patch(route('notifications.read'), { all: true }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        {t.desc}
                        {role ? ` (${role})` : ''}
                    </p>
                </div>
            }
        >
            <Head title={t.title} />
            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 flex flex-col md:flex-row gap-3 md:items-center`}>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t.search}
                            className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        />
                        <button type="button" onClick={markAllRead} className="sr-btn-action-secondary h-10 md:h-10 w-full md:w-auto px-4 text-xs whitespace-nowrap">
                            {t.markAll}
                        </button>
                    </div>

                    {filtered.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>{t.empty}</div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((n) => (
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
                                        <div className="flex flex-col gap-2 shrink-0 items-stretch">
                                            {canMarkRead(n) ? (
                                                <button type="button" onClick={() => markOne(n)} className="sr-btn-action-secondary h-9 md:h-9 w-auto px-3 text-xs">
                                                    {t.markRead}
                                                </button>
                                            ) : null}
                                            {n.link ? (
                                                <Link href={n.link} className="sr-btn-action-primary h-9 md:h-9 w-auto px-3 text-xs text-center">
                                                    {t.open}
                                                </Link>
                                            ) : null}
                                        </div>
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

