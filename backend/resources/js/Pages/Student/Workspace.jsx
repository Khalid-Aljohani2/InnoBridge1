import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Workspace({ team = null, milestones = [] }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [activeMilestoneId, setActiveMilestoneId] = useState(milestones?.[0]?.id ?? null);
    const active = milestones.find((m) => Number(m.id) === Number(activeMilestoneId)) || milestones[0];

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'مساحة العمل',
                      desc: 'رفع ملفات كل مرحلة ومتابعة قرارات المشرف.',
                      noTeam: 'لا يوجد فريق بعد. أنشئ فريقك أولاً.',
                      goTeam: 'الذهاب لصفحة الفريق',
                      noProject: 'لم يتم اعتماد تحدي/مشروع بعد. اختر تحديًا وأرسل طلبًا للمشرف.',
                      goChallenges: 'فتح تحديات الصناعة',
                      supervisor: 'المشرف',
                      milestone: 'المرحلة',
                      upload: 'رفع ملف',
                      uploading: 'جاري الرفع...',
                      titleField: 'العنوان',
                      notesField: 'ملاحظات (اختياري)',
                      fileField: 'الملف',
                      status: 'الحالة',
                      lastSubmissions: 'آخر التسليمات',
                      version: 'نسخة',
                      submittedBy: 'بواسطة',
                      openFile: 'فتح الملف',
                      reviewed: 'تمت المراجعة',
                      needsRevision: 'تحتاج تعديل',
                      submitted: 'بانتظار المراجعة',
                      fileFormatsHint: 'الصيغ المسموحة: PDF، Word (.doc، .docx)، ZIP — حتى 20 ميجابايت.',
                  }
                : {
                      title: 'Workspace',
                      desc: 'Upload milestone files and track supervisor decisions.',
                      noTeam: 'No team yet. Create your team first.',
                      goTeam: 'Go to Team page',
                      noProject: 'No approved project yet. Select a challenge and request approval.',
                      goChallenges: 'Open Industry Challenges',
                      supervisor: 'Supervisor',
                      milestone: 'Milestone',
                      upload: 'Upload submission',
                      uploading: 'Uploading...',
                      titleField: 'Title',
                      notesField: 'Notes (optional)',
                      fileField: 'File',
                      status: 'Status',
                      lastSubmissions: 'Latest submissions',
                      version: 'Version',
                      submittedBy: 'By',
                      openFile: 'Open file',
                      reviewed: 'Reviewed',
                      needsRevision: 'Needs revision',
                      submitted: 'Pending review',
                      fileFormatsHint: 'Allowed formats: PDF, Word (.doc, .docx), ZIP — up to 20 MB.',
                  },
        [isArabic],
    );

    const uploadForm = useForm({
        title: '',
        notes: '',
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        if (!active?.id) return;
        uploadForm.post(route('student.milestones.submissions.upload', active.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => uploadForm.reset('title', 'notes', 'file'),
        });
    };

    const statusLabel = (s) => {
        if (s === 'approved') return t.reviewed;
        if (s === 'rejected') return t.needsRevision;
        if (s === 'in_review') return t.submitted;
        return s || '-';
    };

    if (!team) {
        return (
            <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>}>
                <Head title={t.title} />
                <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                    <div className="sr-page-shell sr-section-stack">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                            <p className={`${isDark ? 'text-slate-200' : 'text-gray-700'} mb-4`}>{t.noTeam}</p>
                            <Link href={route('student.team')} className="sr-btn-action-primary w-auto px-5">
                                {t.goTeam}
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!team || !team.project) {
        return (
            <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>}>
                <Head title={t.title} />
                <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                    <div className="sr-page-shell sr-section-stack">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                            <p className={`${isDark ? 'text-slate-200' : 'text-gray-700'} mb-4`}>{t.noProject}</p>
                            <Link href={route('student.industry-challenges')} className="sr-btn-action-primary w-auto px-5">
                                {t.goChallenges}
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

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
                    {flash?.success && (
                        <div className="sr-alert-success">{flash.success}</div>
                    )}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.project?.title}</h3>
                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    {t.supervisor}: {team.supervisor?.name || '-'}
                                </p>
                            </div>
                                <div className="text-sm font-black text-blue-600 dark:text-sky-300">{team.project?.current_progress ?? 0}%</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.milestone}</h3>
                            <div className="space-y-2">
                                {milestones.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setActiveMilestoneId(m.id)}
                                        className={`w-full text-start rounded-xl p-3 border transition ${
                                            Number(active?.id) === Number(m.id)
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : isDark
                                                  ? 'border-slate-700 hover:bg-slate-800'
                                                  : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{m.title}</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.status}: {statusLabel(m.status)}</p>
                                        {m.due_date ? <p className="text-xs text-indigo-600 mt-1">Due: {m.due_date}</p> : null}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5 xl:col-span-2`}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <h3 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{active?.title || '-'}</h3>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{active?.description || ''}</p>
                                </div>
                            </div>

                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-1">
                                    <input
                                        value={uploadForm.data.title}
                                        onChange={(e) => uploadForm.setData('title', e.target.value)}
                                        placeholder={t.titleField}
                                        className={`w-full rounded-xl ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                    />
                                    {uploadForm.errors.title ? (
                                        <p className="mt-1 text-xs font-semibold text-red-600">{uploadForm.errors.title}</p>
                                    ) : null}
                                </div>
                                <div className="md:col-span-1">
                                    <input
                                        value={uploadForm.data.notes}
                                        onChange={(e) => uploadForm.setData('notes', e.target.value)}
                                        placeholder={t.notesField}
                                        className={`w-full rounded-xl ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                    />
                                    {uploadForm.errors.notes ? (
                                        <p className="mt-1 text-xs font-semibold text-red-600">{uploadForm.errors.notes}</p>
                                    ) : null}
                                </div>
                                <div className="md:col-span-1">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                                        onChange={(e) => uploadForm.setData('file', e.target.files?.[0] || null)}
                                        className={`w-full rounded-xl text-xs ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                    />
                                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.fileFormatsHint}</p>
                                    {uploadForm.errors.file ? (
                                        <p className="mt-1 text-xs font-semibold text-red-600">{uploadForm.errors.file}</p>
                                    ) : null}
                                </div>
                                <button disabled={uploadForm.processing} className="sr-btn-action-primary md:col-span-3 w-auto px-5 text-sm disabled:opacity-60">
                                    {uploadForm.processing ? t.uploading : t.upload}
                                </button>
                            </form>

                            <div className="mt-5">
                                <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.lastSubmissions}</h4>
                                <div className="space-y-2">
                                    {(active?.submissions || []).map((s) => (
                                        <div key={s.id} className={`rounded-xl p-3 border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className={`font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{s.title}</p>
                                                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                        {t.version}: {s.version} · {t.status}: {s.status}
                                                    </p>
                                                </div>
                                                <a
                                                    href={`/storage/${s.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    {t.openFile}
                                                </a>
                                            </div>
                                            {s.review_notes ? <p className={`mt-2 text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{s.review_notes}</p> : null}
                                        </div>
                                    ))}
                                    {(active?.submissions || []).length === 0 ? (
                                        <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>-</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

