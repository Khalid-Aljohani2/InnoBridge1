import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const statusColor = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    awaiting_revision: 'bg-blue-100 text-blue-700',
    pending_action: 'bg-amber-100 text-amber-700',
};

const originalityStyles = {
    unique: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-100',
    partial: 'border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
    high_similarity: 'border-red-300 bg-red-50 text-red-950 dark:bg-red-950/40 dark:border-red-800 dark:text-red-100',
    unknown: 'border-slate-300 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100',
};

const resolveSimilarityPercent = (originality) => {
    const raw = originality?.similarity_score ?? originality?.similarity_percent ?? originality?.max_similarity;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return null;
    if (numeric >= 0 && numeric <= 1) return Math.round(numeric * 100);
    return Math.round(numeric);
};

const resolveSimilarityBand = (percent, tier) => {
    if (typeof percent === 'number') {
        if (percent < 40) return 'unique';
        if (percent <= 70) return 'partial';
        return 'high_similarity';
    }
    if (tier === 'unique') return 'unique';
    if (tier === 'similar') return 'partial';
    if (tier === 'high_match') return 'high_similarity';
    return 'unknown';
};

export default function StudentUploads({ project = null, milestonePath = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const { flash } = usePage().props;
    const parseAiReviewFromProject = () => {
        const feedbacks = project?.feedbacks || [];
        for (const f of feedbacks) {
            const comment = f?.comment || '';
            if (!comment.startsWith('AI_REVIEW_JSON:')) continue;
            try {
                const parsed = JSON.parse(comment.replace('AI_REVIEW_JSON:', ''));
                if (parsed && typeof parsed === 'object') return parsed;
            } catch {
                return null;
            }
        }
        return null;
    };
    const aiReview = parseAiReviewFromProject();
    const originality = flash?.originality || aiReview?.originality || null;
    const brief = aiReview?.brief || null;
    const similarityPercent = resolveSimilarityPercent(originality);
    const similarityBand = resolveSimilarityBand(similarityPercent, originality?.tier);
    const { data, setData, post, processing, errors, reset } = useForm({
        title: project?.title || '',
        description: project?.description || '',
        file: null,
    });

    const t = isArabic
        ? {
              title: 'رفع الفكرة والمستندات',
              desc: 'صفحة مستقلة لإدارة رفع المشروع مع سجل زمني دقيق لحالة المراجعة.',
              formTitle: 'رفع ملف جديد',
              projectTitle: 'عنوان المشروع',
              projectDesc: 'وصف المشروع',
              file: 'الملف',
              send: 'رفع وإرسال للمراجعة',
              progressTitle: 'مسار الإنجاز',
              historyTitle: 'سجل الرفع والمراجعة',
              noHistory: 'لا يوجد سجل بعد.',
              currentPlan: 'الخطة الحالية',
              unknownPlan: 'الخطة الافتراضية',
              status: 'الحالة',
              time: 'الوقت',
              details: 'التفاصيل',
              milestone: 'المرحلة',
              originalityTitle: 'التشابه الدلالي (مقارنة بالمشاريع السابقة)',
              similarityLabel: 'أقصى تشابه',
              matchedLabel: 'أقرب عنوان مسجّل',
              uniqueBadge: 'فريدة (Unique)',
              partialBadge: 'متشابهة جزئيا (Partial)',
              highBadge: 'تشابه عال (High Similarity)',
              unknownBadge: 'غير معروف',
              briefTitle: 'ملخص سريع من الذكاء الاصطناعي',
              briefIdea: 'الفكرة',
              briefTarget: 'الهدف',
              workspaceHintTitle: 'تسليم المراحل للمشرف',
              workspaceHintBody: 'بعد رفع الفكرة، ارفع تسليمات المراحل من مساحة العمل حتى تظهر للمشرف للمراجعة.',
              goToWorkspace: 'الانتقال إلى مساحة العمل',
          }
        : {
              title: 'Idea & Documents Upload',
              desc: 'Dedicated page for uploads with a precise timeline of review status.',
              formTitle: 'Upload New File',
              projectTitle: 'Project Title',
              projectDesc: 'Project Description',
              file: 'File',
              send: 'Upload and Send for Review',
              progressTitle: 'Progress Path',
              historyTitle: 'Upload & Review Timeline',
              noHistory: 'No history yet.',
              currentPlan: 'Current Plan',
              unknownPlan: 'Default Plan',
              status: 'Status',
              time: 'Time',
              details: 'Details',
              milestone: 'Milestone',
              originalityTitle: 'Semantic similarity (vs past projects)',
              similarityLabel: 'Max similarity',
              matchedLabel: 'Closest title',
              uniqueBadge: 'Unique',
              partialBadge: 'Partial',
              highBadge: 'High Similarity',
              unknownBadge: 'Unknown',
              briefTitle: 'AI Quick Brief',
              briefIdea: 'Idea',
              briefTarget: 'Target',
              workspaceHintTitle: 'Milestone submissions for supervisor',
              workspaceHintBody: 'After uploading your idea, submit milestone files from Workspace so the supervisor can review them.',
              goToWorkspace: 'Go to Workspace',
          };

    const submit = (e) => {
        e.preventDefault();
        post(route('student.uploads.store'), {
            forceFormData: true,
            onSuccess: () => reset('file'),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.desc}</p>
                </div>
            }
        >
            <Head title={t.title} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {originality ? (
                        <div className={`xl:col-span-3 rounded-2xl border p-4 ${originalityStyles[similarityBand] || originalityStyles.unknown}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-bold">{t.originalityTitle}</p>
                                <span className="rounded-full border border-current px-2 py-0.5 text-[11px] font-bold">
                                    {similarityBand === 'unique'
                                        ? t.uniqueBadge
                                        : similarityBand === 'partial'
                                          ? t.partialBadge
                                          : similarityBand === 'high_similarity'
                                            ? t.highBadge
                                            : t.unknownBadge}
                                </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed">{originality.message_ar}</p>
                            {similarityPercent != null ? (
                                <p className="mt-2 text-xs opacity-90">
                                    {t.similarityLabel}: {similarityPercent}%
                                </p>
                            ) : null}
                            {originality.matched_title ? (
                                <p className="mt-1 text-xs opacity-90">
                                    {t.matchedLabel}: {originality.matched_title}
                                </p>
                            ) : null}
                            {brief?.idea || brief?.target ? (
                                <div className="mt-3 rounded-xl border border-current/20 p-3 text-xs">
                                    <p className="font-bold">{t.briefTitle}</p>
                                    {brief?.idea ? (
                                        <p className="mt-1">
                                            {t.briefIdea}: {brief.idea}
                                        </p>
                                    ) : null}
                                    {brief?.target ? (
                                        <p className="mt-1">
                                            {t.briefTarget}: {brief.target}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <section className={`xl:col-span-2 p-5 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.formTitle}</h3>
                        <div className={`mb-4 rounded-xl border p-3 ${isDark ? 'border-indigo-700 bg-indigo-950/30 text-indigo-100' : 'border-indigo-200 bg-indigo-50 text-indigo-900'}`}>
                            <p className="text-sm font-bold">{t.workspaceHintTitle}</p>
                            <p className="mt-1 text-xs opacity-90">{t.workspaceHintBody}</p>
                            <Link href={route('student.workspace')} className="mt-2 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                                {t.goToWorkspace}
                            </Link>
                        </div>
                        {flash?.error ? (
                            <div className="sr-alert-error mb-3 !rounded-xl !px-3 !py-2 text-sm">{flash.error}</div>
                        ) : null}
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.projectTitle}</label>
                                <input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className={`mt-1 w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.projectDesc}</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className={`mt-1 w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.file}</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                    className={`mt-1 w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                />
                                {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="sr-btn-action-primary w-auto px-5 disabled:opacity-60"
                            >
                                {t.send}
                            </button>
                        </form>
                    </section>

                    <section className={`p-5 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.progressTitle}</h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                            {t.currentPlan}: {project?.milestone_plan?.name || t.unknownPlan}
                        </p>
                        <div className="mt-4 space-y-2">
                            {milestonePath.map((row, idx) => {
                                const done = (project?.progress || 0) >= (row.progress || 0);
                                return (
                                    <div
                                        key={row.id || idx}
                                        className={`rounded-xl border p-2 ${done ? 'border-green-300 bg-green-50' : isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}
                                    >
                                        <p className="text-sm font-semibold">{idx + 1}. {row.label}</p>
                                        <p className="text-xs text-gray-500">{row.progress}%</p>
                                        {row.submission_title ? <p className="text-xs text-indigo-600 mt-1">{row.submission_title}</p> : null}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className={`xl:col-span-3 p-5 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.historyTitle}</h3>
                        {!project?.histories?.length ? (
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noHistory}</p>
                        ) : (
                            <div className="space-y-3">
                                {project.histories.map((event) => {
                                    const status = event?.meta?.review_status || project?.review_status || 'pending_action';
                                    return (
                                        <div key={event.id} className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-semibold">{event.title}</p>
                                                <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${statusColor[status] || statusColor.pending_action}`}>
                                                    {t.status}: {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{t.time}: {event.created_at}</p>
                                            {event.description ? <p className="text-sm mt-1">{t.details}: {event.description}</p> : null}
                                            {event?.meta?.milestone ? <p className="text-xs mt-1 text-indigo-600">{t.milestone}: {event.meta.milestone}</p> : null}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
