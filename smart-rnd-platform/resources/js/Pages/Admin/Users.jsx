import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, usePage } from '@inertiajs/react';

export default function Users() {
    const { users } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();

    const t = isArabic
        ? {
              title: 'المستخدمون',
              subtitle: 'عرض الحسابات والدخول باسم مستخدم لمتابعة التجربة (خارج حساب المسؤول).',
              thName: 'الاسم',
              thEmail: 'البريد',
              thRole: 'الدور',
              thDept: 'القسم',
              impersonate: 'دخول باسمه',
              noImpersonate: '—',
              prev: 'السابق',
              next: 'التالي',
          }
        : {
              title: 'Users',
              subtitle: 'Browse accounts and sign in as a user to audit their experience.',
              thName: 'Name',
              thEmail: 'Email',
              thRole: 'Role',
              thDept: 'Department',
              impersonate: 'Sign in as',
              noImpersonate: '—',
              prev: 'Previous',
              next: 'Next',
          };

    const rows = users?.data ?? [];

    return (
        <AuthenticatedLayout>
            <Head title={t.title} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className={`sr-section-title ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{t.title}</h1>
                <p className="sr-muted mt-1 max-w-2xl">{t.subtitle}</p>

                <div
                    className={`mt-6 overflow-hidden rounded-2xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900/85' : 'border-slate-200 bg-white'}`}
                >
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                        <thead className={isDark ? 'bg-slate-800/80' : 'bg-slate-50'}>
                            <tr>
                                <th className="px-4 py-3 text-start font-bold text-slate-600 dark:text-slate-300">{t.thName}</th>
                                <th className="px-4 py-3 text-start font-bold text-slate-600 dark:text-slate-300">{t.thEmail}</th>
                                <th className="px-4 py-3 text-start font-bold text-slate-600 dark:text-slate-300">{t.thRole}</th>
                                <th className="px-4 py-3 text-start font-bold text-slate-600 dark:text-slate-300">{t.thDept}</th>
                                <th className="px-4 py-3 text-start font-bold text-slate-600 dark:text-slate-300 w-44" aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {rows.map((u) => (
                                <tr key={u.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{u.name}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                                    <td className="px-4 py-3">{u.role}</td>
                                    <td className="px-4 py-3 text-slate-500">{u.department ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {u.canImpersonate ? (
                                            <PrimaryButton
                                                type="button"
                                                className="!py-2 !text-xs w-full justify-center"
                                                onClick={() =>
                                                    router.post(route('admin.impersonate.start', u.id), {}, { preserveScroll: true })
                                                }
                                            >
                                                {t.impersonate}
                                            </PrimaryButton>
                                        ) : (
                                            <span className="text-slate-400 text-xs">{t.noImpersonate}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <span className="text-xs text-slate-500">
                            {(users?.from ?? 0) && (users?.to ?? 0)
                                ? `${users.from}–${users.to}`
                                : ''}
                            {users?.total != null ? ` / ${users.total}` : ''}
                        </span>
                        <div className="flex gap-2">
                            {users?.prev_page_url ? (
                                <button
                                    type="button"
                                    onClick={() => router.visit(users.prev_page_url, { preserveScroll: true })}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold border ${isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {t.prev}
                                </button>
                            ) : null}
                            {users?.next_page_url ? (
                                <button
                                    type="button"
                                    onClick={() => router.visit(users.next_page_url, { preserveScroll: true })}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold border ${isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {t.next}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
