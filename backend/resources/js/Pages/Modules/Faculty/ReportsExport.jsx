import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useState } from 'react';

export default function ReportsExport() {
    const { filters } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { data, setData, reset } = useForm({
        report_term_id: filters?.terms?.[0]?.id ? String(filters.terms[0].id) : '',
        report_subject_id: '',
        student_user_id: '',
    });

    const t = isArabic
        ? {
              title: 'تصدير تقارير أداء الطلاب',
              subtitle: 'اختر الفصل والمادة أو طالباً محدداً ثم نزّل PDF أو Excel. البيانات مشفّرة حسب صلاحية دورك.',
              term: 'الفصل الدراسي',
              subject: 'المادة (اختياري)',
              student: 'طالب محدد (اختياري)',
              allSubjects: '— كل المواد في النطاق —',
              allStudents: '— كل الطلاب المسموحين —',
              pdf: 'تنزيل PDF',
              excel: 'تنزيل Excel',
              loading: 'جاري التحضير...',
          }
        : {
              title: 'Student performance reports',
              subtitle: 'Pick term, optional subject or student, then download. Data is scoped to your role.',
              term: 'Academic term',
              subject: 'Subject (optional)',
              student: 'Specific student (optional)',
              allSubjects: '— All subjects in scope —',
              allStudents: '— All permitted students —',
              pdf: 'Download PDF',
              excel: 'Download Excel',
              loading: 'Preparing...',
          };

    const download = useCallback(
        async (format) => {
            setError(null);
            setLoading(true);
            try {
                const res = await axios.post(
                    route('faculty.reports.export.download'),
                    {
                        format,
                        report_term_id: Number(data.report_term_id),
                        report_subject_id: data.report_subject_id ? Number(data.report_subject_id) : null,
                        student_user_id: data.student_user_id ? Number(data.student_user_id) : null,
                    },
                    {
                        responseType: 'blob',
                    },
                );
                const blob = new Blob([res.data]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = format === 'pdf' ? 'student-performance.pdf' : 'student-performance.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (e) {
                setError(isArabic ? 'تعذر تنزيل الملف. تحقق من البيانات والصلاحيات.' : 'Download failed. Check filters and permissions.');
            } finally {
                setLoading(false);
            }
        },
        [data, isArabic],
    );

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
                <div className="sr-page-shell max-w-3xl space-y-5">
                    <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-white/95'}`}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="block text-sm font-semibold">
                                <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{t.term}</span>
                                <select
                                    className="mt-1 w-full rounded-xl border"
                                    value={data.report_term_id}
                                    onChange={(e) => setData('report_term_id', e.target.value)}
                                >
                                    {(filters?.terms ?? []).map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {isArabic ? row.name_ar : row.name_en}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-sm font-semibold">
                                <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{t.subject}</span>
                                <select
                                    className="mt-1 w-full rounded-xl border"
                                    value={data.report_subject_id}
                                    onChange={(e) => setData('report_subject_id', e.target.value)}
                                >
                                    <option value="">{t.allSubjects}</option>
                                    {(filters?.subjects ?? []).map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {isArabic ? row.name_ar : row.name_en}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-sm font-semibold md:col-span-2">
                                <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{t.student}</span>
                                <select
                                    className="mt-1 w-full rounded-xl border"
                                    value={data.student_user_id}
                                    onChange={(e) => setData('student_user_id', e.target.value)}
                                >
                                    <option value="">{t.allStudents}</option>
                                    {(filters?.students ?? []).map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => download('pdf')}
                                className="sr-btn-action-primary w-auto px-5"
                            >
                                {loading ? t.loading : t.pdf}
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => download('xlsx')}
                                className="sr-btn-action w-auto rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {loading ? t.loading : t.excel}
                            </button>
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="sr-btn-action-neutral w-auto rounded-xl border px-4 py-2 text-sm"
                            >
                                {isArabic ? 'إعادة ضبط' : 'Reset'}
                            </button>
                        </div>
                        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
