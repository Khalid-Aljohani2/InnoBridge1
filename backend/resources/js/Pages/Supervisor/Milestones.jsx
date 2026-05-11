import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function SupervisorMilestones({ milestones = [], milestoneTemplates = [], groups = [], plans = [], teamsByPlanId = {} }) {
    const { isArabic, isDark } = useUiPreferences();
    const { flash } = usePage().props;
    const [selectedPlanId, setSelectedPlanId] = useState(() => {
        if (typeof window === 'undefined') return plans[0]?.id ? String(plans[0].id) : '';
        const saved = window.localStorage.getItem('supervisor_milestones_selected_plan');
        return saved || (plans[0]?.id ? String(plans[0].id) : '');
    });
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planModalMode, setPlanModalMode] = useState('create');
    const [modalStageCount, setModalStageCount] = useState(4);
    const [hasPreviewData, setHasPreviewData] = useState(false);
    const [previewAnimationKey, setPreviewAnimationKey] = useState(0);
    const [planBuilder, setPlanBuilder] = useState({
        id: null,
        name: '',
        supervisor_group_id: '',
        is_active: true,
        rows: [],
    });
    const [workingPlans, setWorkingPlans] = useState(
        plans.map((p) => ({
            id: String(p.id),
            rawId: p.id,
            isDraft: false,
            name: p.name,
            group_name: p.group_name,
            supervisor_group_id: p.supervisor_group_id ?? '',
            is_active: Boolean(p.is_active),
        })),
    );
    const [templateDrafts, setTemplateDrafts] = useState(
        milestoneTemplates.map((m) => ({
            client_id: `existing-${m.id}`,
            id: m.id,
            title: m.label,
            increment_percent: m.increment_percent ?? 10,
            sort_order: m.sort_order ?? 0,
            submission_title: m.submission_title ?? '',
            deadline: m.deadline ?? '',
            plan_id: m.plan_id ?? '',
            deleted: false,
        })),
    );
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!selectedPlanId && workingPlans[0]?.id) setSelectedPlanId(String(workingPlans[0].id));
    }, [workingPlans, selectedPlanId]);

    useEffect(() => {
        if (!selectedPlanId) return;
        const exists = workingPlans.some((p) => String(p.id) === String(selectedPlanId));
        if (!exists) {
            setSelectedPlanId(workingPlans[0]?.id ? String(workingPlans[0].id) : '');
        }
    }, [selectedPlanId, workingPlans]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!selectedPlanId) return;
        window.localStorage.setItem('supervisor_milestones_selected_plan', String(selectedPlanId));
    }, [selectedPlanId]);

    useEffect(() => {
        setTemplateDrafts(
            milestoneTemplates.map((m) => ({
                id: m.id,
                client_id: `existing-${m.id}`,
                title: m.label,
                increment_percent: m.increment_percent ?? 10,
                sort_order: m.sort_order ?? 0,
                submission_title: m.submission_title ?? '',
                deadline: m.deadline ?? '',
                plan_id: m.plan_id ?? '',
                deleted: false,
            })),
        );
    }, [milestoneTemplates]);

    const t = isArabic
        ? {
              title: 'مراحل الطلاب',
              desc: 'إدارة خطط المراحل لكل مجموعة أو لجميع الطلاب.',
              planTitle: 'خطط المراحل',
              addPlan: 'إضافة خطة',
              editPlan: 'تعديل الخطة',
              planName: 'اسم الخطة',
              selectedPlan: 'الخطة المختارة',
              studentsScope: 'نطاق الطلاب',
              allStudents: 'كل الطلاب',
              group: 'المجموعة',
              active: 'نشطة',
              deleteCurrentPlan: 'حذف الخطة الحالية',
              milestoneTitle: 'مراحل الخطة المختارة',
              stageName: 'اسم المرحلة',
              stagePercent: 'النسبة %',
              stageSubmissionTitle: 'عنوان التسليم',
              stageDeadline: 'الموعد النهائي',
              stageNo: 'رقم المرحلة',
              stagesCount: 'عدد المراحل',
              applyCount: 'تطبيق العدد',
              modalTitleCreate: 'إضافة خطة مراحل جديدة',
              modalTitleEdit: 'تعديل خطة المراحل',
              setupReadyToast: 'تم تجهيز المراحل، يرجى مراجعتها والضغط على حفظ التغييرات',
              savePreview: 'حفظ كمعاينة',
              addStage: 'إضافة مرحلة',
              confirmAdd: 'تأكيد الإضافة',
              cancel: 'إلغاء',
              deleteStage: 'حذف',
              totalPercent: 'مجموع النسب',
              totalInvalid: 'مجموع النسب يتجاوز 100%.',
              mustEqual100: 'لا يمكن الحفظ إلا إذا كان مجموع النسب = 100%.',
              saveAll: 'حفظ كافة التغييرات',
              previewOnly: 'معاينة فقط - لن يتم الحفظ النهائي إلا عبر زر حفظ كافة التغييرات',
              previewHidden: 'المعاينة مخفية حالياً. اضغط "إضافة خطة" ثم "حفظ كمعاينة" لإظهارها.',
              noStagesForPlan: 'لا توجد مراحل محفوظة لهذه الخطة بعد.',
              teamsUsingPlan: 'الفرق التي تستخدم هذه الخطة',
              noTeamsOnPlan: 'لا يوجد فريق مرتبط بهذه الخطة حالياً.',
              teamCol: 'الفريق',
              leaderCol: 'القائد',
              projectCol: 'المشروع',
              progressCol: 'التقدم',
              planStatus: 'حالة الخطة',
              planActive: 'نشطة',
              planInactive: 'غير نشطة',
              rowNo: '#',
              timeline: 'الخط الزمني للخطة',
              modalValidation: 'لا يمكن إغلاق النافذة أو الحفظ قبل أن يساوي مجموع النسب 100%.',
              fieldRequired: 'جميع حقول المراحل مطلوبة.',
          }
        : {
              title: 'Student Milestones',
              desc: 'Manage milestone plans per group or globally, with a timeline view.',
              planTitle: 'Milestone Plans',
              addPlan: 'Add Plan',
              editPlan: 'Edit Plan',
              planName: 'Plan name',
              selectedPlan: 'Selected plan',
              studentsScope: 'Students scope',
              allStudents: 'All students',
              group: 'Group',
              active: 'Active',
              deleteCurrentPlan: 'Delete Current Plan',
              milestoneTitle: 'Milestones of Selected Plan',
              stageName: 'Stage name',
              stagePercent: 'Stage %',
              stageSubmissionTitle: 'Submission title',
              stageDeadline: 'Deadline',
              stageNo: 'Stage No.',
              stagesCount: 'Stages Count',
              applyCount: 'Apply Count',
              modalTitleCreate: 'Create New Milestone Plan',
              modalTitleEdit: 'Edit Milestone Plan',
              setupReadyToast: 'Stages are prepared. Review them then click Save All Changes.',
              savePreview: 'Save as Preview',
              addStage: 'Add Stage',
              confirmAdd: 'Confirm Add',
              cancel: 'Cancel',
              deleteStage: 'Delete',
              totalPercent: 'Total',
              totalInvalid: 'Total exceeds 100%.',
              mustEqual100: 'Plan can only be saved when total equals 100%.',
              saveAll: 'Save All Changes',
              previewOnly: 'Read-only preview. Final save happens only via Save All Changes.',
              previewHidden: 'Preview is hidden. Click "Add Plan" then "Save as Preview" to show it.',
              noStagesForPlan: 'No milestone stages are saved for this plan yet.',
              teamsUsingPlan: 'Teams using this plan',
              noTeamsOnPlan: 'No team is assigned to this plan yet.',
              teamCol: 'Team',
              leaderCol: 'Leader',
              projectCol: 'Project',
              progressCol: 'Progress',
              planStatus: 'Plan status',
              planActive: 'Active',
              planInactive: 'Inactive',
              rowNo: '#',
              timeline: 'Plan Timeline',
              modalValidation: 'Modal cannot close/save unless total percent equals 100%.',
              fieldRequired: 'All stage fields are required.',
          };

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const allPlans = useMemo(() => workingPlans, [workingPlans]);

    const selectedPlanTemplates = useMemo(
        () =>
            templateDrafts
                .filter((x) => String(x.plan_id) === String(selectedPlanId) && !x.deleted)
                .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
        [templateDrafts, selectedPlanId],
    );

    const totalPercent = useMemo(
        () => selectedPlanTemplates.reduce((sum, row) => sum + Number(row.increment_percent || 0), 0),
        [selectedPlanTemplates],
    );
    const totalIsExact = totalPercent === 100;

    const selectedPlan = useMemo(() => allPlans.find((p) => String(p.id) === String(selectedPlanId)), [allPlans, selectedPlanId]);
    const stageCountOptions = useMemo(() => Array.from({ length: 20 }, (_, i) => i + 1), []);

    const teamsForSelectedPlan = useMemo(() => {
        const rawId = selectedPlan?.rawId;
        if (rawId != null && Number.isFinite(Number(rawId))) {
            const key = Number(rawId);
            return teamsByPlanId[key] || teamsByPlanId[String(key)] || [];
        }
        return [];
    }, [teamsByPlanId, selectedPlan]);

    const showTimeline = selectedPlanTemplates.length > 0 || hasPreviewData;
    const emptySelectionHint =
        selectedPlanId && selectedPlanTemplates.length === 0 && !hasPreviewData ? t.noStagesForPlan : t.previewHidden;

    const openCreatePlanModal = () => {
        setPlanModalMode('create');
        setModalStageCount(4);
        setPlanBuilder({
            id: null,
            name: '',
            supervisor_group_id: '',
            is_active: true,
            rows: Array.from({ length: 4 }, (_, idx) => ({
                client_id: `modal-new-${Date.now()}-${idx}`,
                id: null,
                stage_no: idx + 1,
                title: '',
                increment_percent: 0,
                submission_title: '',
                deadline: '',
            })),
        });
        setShowPlanModal(true);
    };

    const openEditPlanModal = () => {
        if (!selectedPlan) {
            setToast({ type: 'error', text: isArabic ? 'اختر خطة أولاً.' : 'Select a plan first.' });
            return;
        }
        const rows = selectedPlanTemplates.map((row, idx) => ({
            client_id: row.client_id || `modal-edit-${Date.now()}-${idx}`,
            id: row.id || null,
            stage_no: idx + 1,
            title: row.title || '',
            increment_percent: Number(row.increment_percent || 0),
            submission_title: row.submission_title || '',
            deadline: row.deadline || '',
        }));
        setPlanModalMode('edit');
        setModalStageCount(Math.max(1, Math.min(20, rows.length || 1)));
        setPlanBuilder({
            id: selectedPlan.id,
            name: selectedPlan.name || '',
            supervisor_group_id: selectedPlan.supervisor_group_id || '',
            is_active: Boolean(selectedPlan.is_active),
            rows: rows.length ? rows : [{
                client_id: `modal-new-${Date.now()}`,
                id: null,
                stage_no: 1,
                title: '',
                increment_percent: 0,
                submission_title: '',
                deadline: '',
            }],
        });
        setShowPlanModal(true);
    };

    const resetPlanBuilder = () => {
        setModalStageCount(4);
        setPlanBuilder({
            id: null,
            name: '',
            supervisor_group_id: '',
            is_active: true,
            rows: [],
        });
    };

    const modalTotalPercent = useMemo(
        () => planBuilder.rows.reduce((sum, row) => sum + Number(row.increment_percent || 0), 0),
        [planBuilder.rows],
    );
    const modalTotalPercentRatio = Math.min(100, Math.max(0, modalTotalPercent));
    const modalTotalIsExact = modalTotalPercent === 100;

    const applyModalStageCount = () => {
        const count = Number(modalStageCount || 1);
        setPlanBuilder((prev) => ({
            ...prev,
            rows: Array.from({ length: count }, (_, idx) => {
                const existing = prev.rows[idx];
                return {
                    client_id: existing?.client_id || `modal-row-${Date.now()}-${idx}`,
                    id: existing?.id || null,
                    stage_no: idx + 1,
                    title: existing?.title || '',
                    increment_percent: Number(existing?.increment_percent || 0),
                    submission_title: existing?.submission_title || '',
                    deadline: existing?.deadline || '',
                };
            }),
        }));
    };

    const updateBuilderRow = (idx, patch) => {
        setPlanBuilder((prev) => ({
            ...prev,
            rows: prev.rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
        }));
    };

    const addBuilderRow = () => {
        setPlanBuilder((prev) => ({
            ...prev,
            rows: [
                ...prev.rows,
                {
                    client_id: `modal-row-${Date.now()}-${prev.rows.length}`,
                    id: null,
                    stage_no: prev.rows.length + 1,
                    title: '',
                    increment_percent: 0,
                    submission_title: '',
                    deadline: '',
                },
            ].slice(0, 20).map((row, idx) => ({ ...row, stage_no: idx + 1 })),
        }));
        setModalStageCount((prev) => Math.min(20, Number(prev || 1) + 1));
    };

    const removeBuilderRow = (idx) => {
        setPlanBuilder((prev) => ({
            ...prev,
            rows: prev.rows.filter((_, i) => i !== idx).map((row, i) => ({ ...row, stage_no: i + 1 })),
        }));
        setModalStageCount((prev) => Math.max(1, Number(prev || 1) - 1));
    };

    const cancelPlanModal = () => {
        setShowPlanModal(false);
        resetPlanBuilder();
    };

    const savePlanPreviewFromModal = () => {
        const name = String(planBuilder.name || '').trim();
        if (!name) {
            setToast({ type: 'error', text: isArabic ? 'اسم الخطة مطلوب.' : 'Plan name is required.' });
            return;
        }
        if (!planBuilder.rows.length || !modalTotalIsExact) {
            setToast({ type: 'error', text: t.modalValidation });
            return;
        }
        const hasMissing = planBuilder.rows.some((row) => !String(row.title || '').trim() || !String(row.submission_title || '').trim() || Number(row.increment_percent || 0) <= 0);
        if (hasMissing) {
            setToast({ type: 'error', text: t.fieldRequired });
            return;
        }

        let targetPlanId = planBuilder.id ? String(planBuilder.id) : `draft-${Date.now()}`;

        setWorkingPlans((prev) => {
            const nextPlan = {
                id: targetPlanId,
                rawId: Number.isFinite(Number(targetPlanId)) ? Number(targetPlanId) : null,
                isDraft: !Number.isFinite(Number(targetPlanId)),
                name,
                group_name: groups.find((g) => String(g.id) === String(planBuilder.supervisor_group_id))?.name || null,
                supervisor_group_id: planBuilder.supervisor_group_id || '',
                is_active: Boolean(planBuilder.is_active),
            };
            const exists = prev.some((p) => String(p.id) === String(targetPlanId));
            if (exists) return prev.map((p) => (String(p.id) === String(targetPlanId) ? nextPlan : p));
            return [nextPlan, ...prev];
        });

        const nextRows = planBuilder.rows.map((row, idx) => ({
            client_id: row.client_id || `preview-${targetPlanId}-${idx}`,
            id: row.id || null,
            title: String(row.title || '').trim(),
            increment_percent: Number(row.increment_percent || 0),
            sort_order: idx + 1,
            submission_title: String(row.submission_title || '').trim(),
            deadline: row.deadline || '',
            plan_id: targetPlanId,
            deleted: false,
        }));
        setTemplateDrafts((prev) => {
            const others = prev.filter((x) => String(x.plan_id) !== String(targetPlanId));
            return [...others, ...nextRows];
        });

        setSelectedPlanId(String(targetPlanId));
        setShowPlanModal(false);
        setHasPreviewData(true);
        setPreviewAnimationKey(Date.now());
        setToast({ type: 'success', text: t.setupReadyToast });
        resetPlanBuilder();
    };

    const saveAllChanges = () => {
        if (!selectedPlanId) {
            setToast({ type: 'error', text: isArabic ? 'اختر خطة أولاً.' : 'Select a plan first.' });
            return;
        }
        if (!totalIsExact) {
            setToast({ type: 'error', text: t.mustEqual100 });
            return;
        }
        if (!selectedPlan) {
            setToast({ type: 'error', text: isArabic ? 'الخطة غير موجودة.' : 'Plan not found.' });
            return;
        }

        const rows = selectedPlanTemplates.map((row, index) => ({
            id: row.id,
            title: row.title,
            increment_percent: Number(row.increment_percent || 0),
            submission_title: row.submission_title,
            deadline: row.deadline || null,
            sort_order: index + 1,
        }));

        router.post(route('supervisor.milestone-plans.bundle-save'), {
            plan_id: selectedPlan.isDraft ? null : selectedPlan.rawId,
            name: selectedPlan.name,
            supervisor_group_id: selectedPlan.supervisor_group_id || null,
            is_active: Boolean(selectedPlan.is_active),
            rows,
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<div><h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2><p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.desc}</p></div>}>
            <Head title={t.title} />
            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    {toast && (
                        <div className={`fixed top-5 z-[60] ${isArabic ? 'left-5' : 'right-5'} rounded-xl px-4 py-3 text-sm font-bold shadow-lg ${
                            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                            {toast.text}
                        </div>
                    )}
                    {flash?.success && <div className="sr-alert-success !rounded-lg !px-3 !py-2 text-sm">{flash.success}</div>}
                    {flash?.error && <div className="sr-alert-error !rounded-lg !px-3 !py-2 text-sm">{flash.error}</div>}

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4`}>
                        <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.planTitle}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 items-end">
                            <div className="md:col-span-5">
                                <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.selectedPlan}</label>
                                <select
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                    className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                >
                                    {allPlans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} - {p.group_name || t.allStudents}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <button type="button" onClick={openCreatePlanModal} className="sr-btn-action-primary">
                                    {t.addPlan}
                                </button>
                            </div>
                            <div className="md:col-span-2">
                                <button type="button" onClick={openEditPlanModal} className="sr-btn-action-secondary">
                                    {t.editPlan}
                                </button>
                            </div>
                            <div className="md:col-span-3">
                                {selectedPlanId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedPlan?.isDraft) {
                                                setWorkingPlans((prev) => prev.filter((p) => String(p.id) !== String(selectedPlanId)));
                                                setTemplateDrafts((prev) => prev.filter((row) => String(row.plan_id) !== String(selectedPlanId)));
                                                setSelectedPlanId(allPlans.find((p) => String(p.id) !== String(selectedPlanId))?.id || '');
                                                return;
                                            }
                                            router.delete(route('supervisor.milestone-plans.destroy', selectedPlan.rawId), { preserveScroll: true });
                                        }}
                                        className="sr-btn-action-danger"
                                    >
                                        {t.deleteCurrentPlan}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4`}>
                        <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.milestoneTitle}</h3>
                        {!showTimeline ? (
                            <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                                isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'
                            }`}>
                                {emptySelectionHint}
                            </div>
                        ) : (
                            <div key={previewAnimationKey} style={{ animation: 'srModalIn 220ms ease-out' }}>
                                {selectedPlan && !selectedPlan.isDraft ? (
                                    <div className={`mb-4 flex flex-wrap gap-3 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        <span>
                                            <span className="font-bold">{t.planStatus}:</span>{' '}
                                            {selectedPlan.is_active ? (
                                                <span className="text-emerald-600 font-semibold">{t.planActive}</span>
                                            ) : (
                                                <span className="text-amber-700 font-semibold">{t.planInactive}</span>
                                            )}
                                        </span>
                                        <span>
                                            <span className="font-bold">{t.studentsScope}:</span>{' '}
                                            {selectedPlan.group_name || t.allStudents}
                                        </span>
                                        <span>
                                            <span className="font-bold">{t.timeline}:</span> {selectedPlanTemplates.length}{' '}
                                            {isArabic ? 'مراحل' : 'stages'}
                                        </span>
                                    </div>
                                ) : null}

                                <div className="mb-3">
                                    <div className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                                        totalIsExact
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }`}>
                                        {t.totalPercent}: {totalPercent}%{!totalIsExact ? ` - ${t.mustEqual100}` : ''}
                                    </div>
                                    <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.previewOnly}</p>
                                </div>

                                <div className={`hidden md:grid md:grid-cols-5 gap-2 mb-2 px-1 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    <div>{t.stageNo}</div>
                                    <div>{t.stageName}</div>
                                    <div>{t.stagePercent}</div>
                                    <div>{t.stageSubmissionTitle}</div>
                                    <div>{t.stageDeadline}</div>
                                </div>

                                <div className="space-y-2 mt-3">
                                    {selectedPlanTemplates.map((row, index) => (
                                        <div key={row.client_id} className={`group relative rounded-xl p-3 border transition ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                                <div className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-700 border border-gray-300'}`}>{index + 1}</div>
                                                <div className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-800 border border-gray-300'}`}>{row.title}</div>
                                                <div className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-800 border border-gray-300'}`}>{row.increment_percent}</div>
                                                <div className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-800 border border-gray-300'}`}>{row.submission_title}</div>
                                                <div className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-800 border border-gray-300'}`}>{row.deadline || '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedPlan?.rawId ? (
                                    <div className={`mt-6 border-t pt-4 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                        <h4 className={`text-sm font-black mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.teamsUsingPlan}</h4>
                                        {teamsForSelectedPlan.length === 0 ? (
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.noTeamsOnPlan}</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className={`text-left border-b ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-200 text-gray-500'}`}>
                                                            <th className="py-2 pe-3 font-bold">{t.teamCol}</th>
                                                            <th className="py-2 pe-3 font-bold">{t.leaderCol}</th>
                                                            <th className="py-2 pe-3 font-bold">{t.projectCol}</th>
                                                            <th className="py-2 font-bold">{t.progressCol}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {teamsForSelectedPlan.map((tm) => (
                                                            <tr key={tm.team_id} className={`border-b ${isDark ? 'border-slate-800 text-slate-200' : 'border-gray-100 text-gray-800'}`}>
                                                                <td className="py-2 pe-3 font-semibold">{tm.team_name}</td>
                                                                <td className="py-2 pe-3">{tm.leader_name || '—'}</td>
                                                                <td className="py-2 pe-3">{tm.project_title || '—'}</td>
                                                                <td className="py-2">
                                                                    <span className="font-black text-blue-600">{tm.current_progress ?? 0}%</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={saveAllChanges}
                                    className={`sr-btn-action ${
                                            totalIsExact
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {t.saveAll}
                                    </button>
                                    {selectedPlan?.group_name && (
                                        <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.group}: {selectedPlan.group_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {showPlanModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={cancelPlanModal}
                    />
                    <div
                        className={`relative w-full max-w-6xl rounded-2xl border p-5 shadow-2xl ${
                            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                        }`}
                        style={{ animation: 'srModalIn 180ms ease-out' }}
                    >
                        <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                            {planModalMode === 'create' ? t.modalTitleCreate : t.modalTitleEdit}
                        </h4>

                        <div className={`rounded-xl p-4 border mb-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.planName}</label>
                                    <input
                                        value={planBuilder.name}
                                        onChange={(e) => setPlanBuilder((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder={t.planName}
                                        className={`w-full rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300 bg-white'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.studentsScope}</label>
                                    <select
                                        value={planBuilder.supervisor_group_id}
                                        onChange={(e) => setPlanBuilder((prev) => ({ ...prev, supervisor_group_id: e.target.value }))}
                                        className={`w-full rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300 bg-white'}`}
                                    >
                                        <option value="">{t.allStudents}</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                                        isDark ? 'border-slate-600 bg-slate-900 text-slate-100' : 'border-gray-300 bg-white text-gray-800'
                                    }`}>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(planBuilder.is_active)}
                                            onChange={(e) => setPlanBuilder((prev) => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        {t.active}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-xl p-4 border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                                <select
                                    value={modalStageCount}
                                    onChange={(e) => setModalStageCount(Number(e.target.value))}
                                    className={`rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                >
                                    {stageCountOptions.map((n) => (
                                        <option key={n} value={n}>
                                            {t.stagesCount}: {n}
                                        </option>
                                    ))}
                                </select>
                                <button type="button" onClick={applyModalStageCount} className="rounded-lg bg-indigo-600 text-white font-semibold text-sm px-3 py-2 hover:bg-indigo-700">
                                    {t.applyCount}
                                </button>
                                <button type="button" onClick={addBuilderRow} className="rounded-lg bg-blue-600 text-white font-semibold text-sm px-3 py-2 hover:bg-blue-700">
                                    {t.addStage}
                                </button>
                            </div>

                            <div className={`mb-4 rounded-xl border px-3 py-2 text-sm font-bold ${
                                modalTotalPercent > 100
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : modalTotalIsExact
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}>
                                {t.totalPercent}: {modalTotalPercent}% {!modalTotalIsExact ? `- ${t.mustEqual100}` : ''}
                            </div>
                            <div className={`mb-4 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                <div
                                    className={`h-2 rounded-full transition-all ${
                                        modalTotalPercent > 100 ? 'bg-red-500' : modalTotalIsExact ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${modalTotalPercentRatio}%` }}
                                />
                            </div>

                            <div className="max-h-[42vh] overflow-auto space-y-2">
                                <div className={`hidden md:grid md:grid-cols-5 gap-2 mb-2 px-1 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    <div>{t.stageNo}</div>
                                    <div>{t.stageName}</div>
                                    <div>{t.stagePercent}</div>
                                    <div>{t.stageSubmissionTitle}</div>
                                    <div>{t.stageDeadline}</div>
                                </div>
                                {planBuilder.rows.map((row, idx) => (
                                    <div key={row.client_id || idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                        <input value={idx + 1} readOnly className={`rounded-lg ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-700'}`} />
                                        <input value={row.title} onChange={(e) => updateBuilderRow(idx, { title: e.target.value })} className={`rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`} />
                                        <input type="number" min="1" max="100" value={row.increment_percent} onChange={(e) => updateBuilderRow(idx, { increment_percent: e.target.value })} className={`rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`} />
                                        <input value={row.submission_title} onChange={(e) => updateBuilderRow(idx, { submission_title: e.target.value })} className={`rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'}`} />
                                        <div className="flex gap-2">
                                            <input type="date" value={row.deadline || ''} onChange={(e) => updateBuilderRow(idx, { deadline: e.target.value })} className={`flex-1 rounded-lg ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300 bg-white text-gray-800'}`} />
                                            <button type="button" onClick={() => removeBuilderRow(idx)} className="rounded-lg bg-red-600 text-white text-xs font-semibold px-3 py-2 hover:bg-red-700">{t.deleteStage}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={cancelPlanModal}
                                className={`sr-btn-action-neutral h-10 md:h-10 ${
                                    isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={savePlanPreviewFromModal}
                                className="sr-btn-action-primary h-10 md:h-10"
                            >
                                {t.savePreview}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
