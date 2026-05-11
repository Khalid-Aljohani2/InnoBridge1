import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/ui/StatCard';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link } from '@inertiajs/react';
import { Building2, GraduationCap, UsersRound } from 'lucide-react';

export default function Overview({ counts, usersByRole }) {
    const { isArabic, isDark } = useUiPreferences();

    const t = isArabic
        ? {
              title: 'لوحة المسؤول',
              subtitle: 'نظرة عامة على المنصة وروابط سريعة للمراجعة.',
              users: 'المستخدمون',
              teams: 'الفرق',
              projects: 'المشاريع',
              byRole: 'حسب الدور',
              quick: 'روابط سريعة',
              userDirectory: 'دليل المستخدمين',
              supervisorSpace: 'مساحة المشرف',
              hodPanel: 'لوحة رئيس القسم',
              teamsMonitor: 'مراقبة الفرق',
              industryPortal: 'بوابة الصناعة',
          }
        : {
              title: 'Administrator',
              subtitle: 'Platform snapshot and shortcuts for review.',
              users: 'Users',
              teams: 'Teams',
              projects: 'Projects',
              byRole: 'By role',
              quick: 'Shortcuts',
              userDirectory: 'User directory',
              supervisorSpace: 'Supervisor workspace',
              hodPanel: 'HoD panel',
              teamsMonitor: 'Teams monitor',
              industryPortal: 'Industry portal',
          };

    const roles = usersByRole && typeof usersByRole === 'object' ? Object.entries(usersByRole) : [];

    return (
        <AuthenticatedLayout>
            <Head title={t.title} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className={`sr-section-title ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{t.title}</h1>
                <p className="sr-muted mt-1 max-w-2xl">{t.subtitle}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard icon={UsersRound} label={t.users} value={counts?.users ?? 0} tone="blue" isDark={isDark} />
                    <StatCard icon={GraduationCap} label={t.teams} value={counts?.teams ?? 0} tone="emerald" isDark={isDark} />
                    <StatCard icon={Building2} label={t.projects} value={counts?.projects ?? 0} tone="navy" isDark={isDark} />
                </div>

                <div
                    className={`mt-8 rounded-2xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white/95'}`}
                >
                    <h2 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.byRole}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {roles.length === 0 ? (
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>—</span>
                        ) : (
                            roles.map(([role, n]) => (
                                <span
                                    key={role}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                        isDark ? 'bg-slate-800 text-slate-200 border border-slate-600' : 'bg-slate-100 text-slate-800'
                                    }`}
                                >
                                    <span>{role}</span>
                                    <span className="tabular-nums opacity-80">{n}</span>
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <div
                    className={`mt-8 rounded-2xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white/95'}`}
                >
                    <h2 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.quick}</h2>
                    <ul className={`mt-4 grid gap-2 sm:grid-cols-2 text-sm font-semibold ${isDark ? 'text-teal-200' : 'text-[#0B2447]'}`}>
                        <li>
                            <Link href={route('admin.users.index')} className="underline underline-offset-2 hover:no-underline">
                                {t.userDirectory}
                            </Link>
                        </li>
                        <li>
                            <Link href={route('supervisor.students')} className="underline underline-offset-2 hover:no-underline">
                                {t.supervisorSpace}
                            </Link>
                        </li>
                        <li>
                            <Link href={route('hod.panel')} className="underline underline-offset-2 hover:no-underline">
                                {t.hodPanel}
                            </Link>
                        </li>
                        <li>
                            <Link href={route('hod.teams.monitor')} className="underline underline-offset-2 hover:no-underline">
                                {t.teamsMonitor}
                            </Link>
                        </li>
                        <li>
                            <Link href={route('industry.portal')} className="underline underline-offset-2 hover:no-underline">
                                {t.industryPortal}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
