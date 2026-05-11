import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SupervisorGanttTimeline from '@/modules/gantt/SupervisorGanttTimeline';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, usePage } from '@inertiajs/react';

export default function ProjectTimeline() {
    const { gantt } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const tasks = gantt?.tasks ?? [];

    const t = isArabic
        ? {
              title: 'المخطط الزمني للمشاريع',
              subtitle: 'عرض مراحل المشروع (نمط جانت) للفرق تحت إشرافك.',
          }
        : {
              title: 'Project timeline',
              subtitle: 'Gantt-style milestones for teams you supervise.',
          };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.subtitle}</p>
                </div>
            }
        >
            <Head title={t.title} />
            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell">
                    <SupervisorGanttTimeline tasks={tasks} isArabic={isArabic} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
