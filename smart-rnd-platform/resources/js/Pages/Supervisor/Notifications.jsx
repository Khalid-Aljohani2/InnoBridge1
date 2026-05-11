import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function SupervisorNotifications({ notifications = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const [search, setSearch] = useState('');

    const t = isArabic
        ? {
              title: 'الإشعارات',
              desc: 'كل إشعارات الطلاب المرسلة من حسابك.',
              search: 'ابحث بعنوان الإشعار أو اسم الطالب...',
              empty: 'لا توجد إشعارات حالياً.',
              to: 'إلى',
          }
        : {
              title: 'Notifications',
              desc: 'All student notifications sent from your account.',
              search: 'Search by notification title or student...',
              empty: 'No notifications yet.',
              to: 'To',
          };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return notifications;
        return notifications.filter(
            (n) =>
                (n.title || '').toLowerCase().includes(term) ||
                (n.message || '').toLowerCase().includes(term) ||
                (n.student?.name || '').toLowerCase().includes(term),
        );
    }, [notifications, search]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.desc}</p>
                </div>
            }
        >
            <Head title={t.title} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell max-w-5xl">
                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 mb-4`}>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t.search}
                            className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>
                            {t.empty}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((n) => (
                                <div key={n.id} className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4`}>
                                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{n.title}</p>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{n.message}</p>
                                    <p className="text-xs mt-2 text-blue-600">{t.to}: {n.student?.name || '-'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
