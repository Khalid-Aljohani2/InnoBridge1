import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Workspace({ team = null, milestones = [], isPendingReview = false }) {
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
                      noProject: 'لم يتم اعتماد فكرة مشروع أو تحدي صناعة بعد. قم برفع فكرتك أو اختر من تحديات الصناعة وأرسل طلباً للمشرف.',
                      pendingProject: 'طلبك الخاص بمشروع التخرج / تحدي الصناعة قيد المراجعة والتدقيق حالياً من قبل المشرف. بمجرد الاعتماد، سيتم فتح سجل تسليم المراحل بالكامل هنا.',
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
                      noProject: 'No approved project idea or industry challenge yet. Upload your idea or pick a challenge and request supervisor approval.',
                      pendingProject: 'Your project idea / industry challenge request is currently under review by the supervisor. Once approved, the full milestone submission log will open here.',
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

    const isProjectReady = useMemo(() => {
        if (!team?.project) return false;
        // Project is ready if it's either an industry challenge or its status is not draft
        return team.project.industry_challenge_id || !['draft'].includes(team.project.status);
    }, [team?.project]);

    if (!team) {
        return (
            <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>}>
                <Head title={t.title} />
                <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                    <div className="sr-page-shell sr-section-stack">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-8 text-center`}>
                             <div className="mb-4 flex justify-center">
                                <div className="p-4 rounded-full bg-blue-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className={`${isDark ? 'text-slate-200' : 'text-gray-700'} mb-6 text-lg font-medium`}>{t.noTeam}</p>
                            <Link href={route('student.team')} className="sr-btn-action-primary w-auto px-8 py-3">
                                {t.goTeam}
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!isProjectReady) {
        return (
            <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>}>
                <Head title={t.title} />
                <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                    <div className="sr-page-shell sr-section-stack">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-10 text-center shadow-xl`}>
                            <div className="mb-6 flex justify-center">
                                <div className={`p-5 rounded-full ${isPendingReview ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                                    {isPendingReview ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                {isPendingReview 
                                    ? (isArabic ? 'طلبك قيد المراجعة' : 'Under Review')
                                    : (isArabic ? 'بانتظار اعتماد المشروع' : 'Awaiting Project Approval')
                                }
                            </h3>
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mb-8 max-w-2xl mx-auto leading-relaxed font-medium`}>
                                {isPendingReview ? t.pendingProject : t.noProject}
                            </p>
                            {!isPendingReview && (
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Link href={route('student.uploads')} className="sr-btn-action-primary w-auto px-6 py-2.5">
                                        {isArabic ? 'رفع فكرة المشروع' : 'Upload Project Idea'}
                                    </Link>
                                    <Link href={route('student.industry-challenges')} className="sr-btn-action-secondary w-auto px-6 py-2.5">
                                        {t.goChallenges}
                                    </Link>
                                </div>
                            )}
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
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className={`text-xl font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{team.project?.title}</h3>
                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    {t.supervisor}: <span className="font-bold">{team.supervisor?.name || '-'}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-blue-600 dark:text-sky-300">{team.project?.current_progress ?? 0}%</div>
                                <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {isArabic ? 'نسبة الإنجاز' : 'Overall Progress'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {milestones.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-8 text-center border-dashed border-2`}>
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {isArabic 
                                    ? 'المشروع معتمد ولكن بانتظار قيام المشرف بتعيين خطة المراحل (Milestone Plan) للبدء.' 
                                    : 'Project is approved, but awaiting the supervisor to assign a Milestone Plan to begin.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                                <div>
                                    <h3 className={`text-xl font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{active?.title || '-'}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            active?.status === 'approved' ? 'bg-green-500/20 text-green-500' : 
                                            active?.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 
                                            'bg-blue-500/20 text-blue-500'
                                        }`}>
                                            {statusLabel(active?.status)}
                                        </span>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {isArabic ? 'وزن المرحلة:' : 'Weight:'} {active?.weight}%
                                        </p>
                                    </div>
                                    <p className={`text-sm mt-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{active?.description || ''}</p>
                                </div>
                            </div>

                            <div className={`mt-6 p-6 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {t.upload}
                                </h4>
                                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.titleField}</label>
                                        <input
                                            value={uploadForm.data.title}
                                            onChange={(e) => uploadForm.setData('title', e.target.value)}
                                            placeholder="e.g. Final Report V1"
                                            className={`w-full rounded-xl text-sm ${isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-gray-300'}`}
                                        />
                                        {uploadForm.errors.title ? (
                                            <p className="mt-1 text-[11px] font-semibold text-red-600">{uploadForm.errors.title}</p>
                                        ) : null}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.fileField}</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                                            onChange={(e) => uploadForm.setData('file', e.target.files?.[0] || null)}
                                            className={`w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black ${isDark ? 'file:bg-slate-800 file:text-slate-200 text-slate-400' : 'file:bg-blue-50 file:text-blue-700 text-gray-500'}`}
                                        />
                                        {uploadForm.errors.file ? (
                                            <p className="mt-1 text-[11px] font-semibold text-red-600">{uploadForm.errors.file}</p>
                                        ) : null}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.notesField}</label>
                                        <textarea
                                            value={uploadForm.data.notes}
                                            onChange={(e) => uploadForm.setData('notes', e.target.value)}
                                            rows={2}
                                            className={`w-full rounded-xl text-sm ${isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-gray-300'}`}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-between gap-4">
                                        <p className={`text-[10px] italic ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.fileFormatsHint}</p>
                                        <button disabled={uploadForm.processing} className="sr-btn-action-primary w-auto px-10 py-2.5 text-sm disabled:opacity-60 flex items-center gap-2">
                                            {uploadForm.processing ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : null}
                                            {uploadForm.processing ? t.uploading : t.upload}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="mt-10">
                                <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t.lastSubmissions}
                                </h4>
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
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

