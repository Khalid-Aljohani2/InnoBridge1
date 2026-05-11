import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

/**
 * Supervisor → HoD nomination pool → Company (مسار تحديات الصناعة المعدّل).
 * Props: poolRequests, declineTemplates
 */
export default function HodIndustryNominations({ poolRequests = [], declineTemplates = [] }) {
    const { flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    const t = useMemo(
        () =>
            isArabic
                ? {
                      title: 'ترشيح الفرق إلى الشركة (تحديات الصناعة)',
                      desc: 'فرق الموافقة من المشرف تظهر هنا. ترشّح واحداً أو أكثر لعرضهم على الشركة، أو بلّغ بعدم الترشيح بقالب جاهز.',
                      empty: 'لا توجد فرق بانتظار ترشيحك لهذا التحدي.',
                      challenge: 'التحدي',
                      team: 'الفريق',
                      supervisor: 'مشرف المجموعة',
                      student: 'مقدّم الطلب',
                      nominate: 'ترشيح المحددة للشركة',
                      nominateHint: 'اختر الطلبات لنفس التحدي ثم ارسلها للشركة.',
                      declineTpl: 'قالب عدم الترشيح',
                      declineBtn: 'إغلاق الطلب مع إخطار الطلاب',
                      notes: 'ملاحظات (اختياري)',
                      toggle: 'إدراج بالترشيح',
                  }
                : {
                      title: 'Nominate teams to the company',
                      desc: 'Supervisor-approved teams appear here. Nominate one or more for company review, or close with an apology template.',
                      empty: 'No teams awaiting your nomination.',
                      challenge: 'Challenge',
                      team: 'Team',
                      supervisor: 'Supervisor',
                      student: 'Requesting student',
                      nominate: 'Send selected to company',
                      nominateHint: 'Select rows for one challenge only, then submit.',
                      declineTpl: 'Decline template',
                      declineBtn: 'Close & notify students',
                      notes: 'Notes (optional)',
                      toggle: 'Select',
                  },
        [isArabic],
    );

    const tplDefault = declineTemplates?.[0]?.key || 'not_nominated_efficiency';

    const grouped = useMemo(() => {
        const m = new Map();
        for (const r of poolRequests || []) {
            const cid = r.industry_challenge_id ?? r.industryChallenge?.id ?? 0;
            if (!m.has(cid)) m.set(cid, []);
            m.get(cid).push(r);
        }
        return m;
    }, [poolRequests]);

    const toggleSel = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const submitNominate = () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        router.post(
            route('hod.industry-nominations.nominate'),
            { challenge_request_ids: ids },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedIds(new Set()),
            },
        );
    };

    const shellBg = `industry-dark-shell min-h-screen py-8 ${isDark ? 'bg-gradient-to-br from-slate-950 via-emerald-950/30 to-teal-950/50' : 'sr-app-bg'}`;
    const emptyCard = isDark
        ? 'custom-card border border-emerald-500/25 bg-slate-900/85 text-slate-200 p-8'
        : 'sr-card-light border border-emerald-100 p-8 text-gray-700 shadow-sm';
    const groupCard = isDark
        ? 'custom-card border border-emerald-500/30 bg-slate-900/90 p-6'
        : 'sr-card-light border border-emerald-100 p-6 shadow-sm';

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
            <div dir={isArabic ? 'rtl' : 'ltr'} className={shellBg}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && <div className="sr-alert-success">{flash.success}</div>}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    {(poolRequests || []).length === 0 ? (
                        <div className={emptyCard}>{t.empty}</div>
                    ) : (
                        [...grouped.entries()].map(([challengeId, rows]) => (
                            <div key={challengeId} className={groupCard}>
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                            {t.challenge}
                                        </p>
                                        <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {rows[0]?.industry_challenge?.title || rows[0]?.industryChallenge?.title || `#${challengeId}`}
                                        </h3>
                                    </div>
                                    <button type="button" className="btn-gradient w-auto rounded-[15px] px-5 py-2.5 text-sm font-bold" onClick={submitNominate}>
                                        {t.nominate}
                                    </button>
                                </div>
                                <p className={`mb-4 text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.nominateHint}</p>
                                <div className="space-y-4">
                                    {rows.map((r) => (
                                        <PoolRow
                                            key={r.id}
                                            r={r}
                                            t={t}
                                            tplDefault={tplDefault}
                                            declineTemplates={declineTemplates}
                                            selected={selectedIds.has(r.id)}
                                            onToggle={() => toggleSel(r.id)}
                                            isArabic={isArabic}
                                            isDark={isDark}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PoolRow({ r, t, tplDefault, declineTemplates, selected, onToggle, isArabic, isDark }) {
    const { data, setData, processing } = useForm({
        template_key: tplDefault,
        notes: '',
    });

    const declineSubmit = () => {
        router.patch(
            route('hod.industry-requests.decline-from-pool', r.id),
            {
                template_key: data.template_key,
                notes: data.notes || null,
            },
            { preserveScroll: true },
        );
    };

    return (
        <div
            className={`flex flex-wrap items-start justify-between gap-4 rounded-[15px] border p-4 ${
                isDark ? 'border-slate-700/90 bg-slate-950/60' : 'border-gray-200 bg-gray-50'
            }`}
        >
            <div className="flex min-w-0 flex-1 gap-3">
                <button
                    type="button"
                    aria-pressed={selected}
                    onClick={onToggle}
                    className={`mt-1 h-10 rounded-[12px] px-3 text-xs font-bold border transition ${
                        selected
                            ? isDark
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                : 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : isDark
                              ? 'border-slate-600 text-slate-300 hover:border-emerald-600/60'
                              : 'border-gray-300 text-gray-700 hover:border-emerald-500/60'
                    }`}
                >
                    {isArabic ? (selected ? '✓ محدد' : '+ تحديد') : selected ? 'Selected' : '+ Select'}
                </button>
                <div className="min-w-0">
                    <p className={`text-[11px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t.team}</p>
                    <p className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.team?.name}</p>
                    <p className={`mt-2 text-xs ${isDark ? 'text-teal-200/95' : 'text-teal-800'}`}>
                        {t.supervisor}: {r.team?.supervisor?.name ?? '—'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {t.student}: {r.requested_by_student?.name || r.requestedByStudent?.name || '—'}
                    </p>
                </div>
            </div>
            <div className="w-full space-y-2 md:w-80">
                <label className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.declineTpl}</label>
                <select
                    value={data.template_key}
                    onChange={(e) => setData('template_key', e.target.value)}
                    disabled={processing}
                    className={`w-full rounded-[12px] border text-sm ${
                        isDark ? 'border-emerald-600/35 bg-slate-900 text-slate-100' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                >
                    {declineTemplates.map((row) => (
                        <option key={row.key} value={row.key}>
                            {(isArabic ? row.ar : row.en) || row.key}
                        </option>
                    ))}
                </select>
                <textarea
                    placeholder={t.notes}
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={2}
                    className={`w-full rounded-[12px] border text-sm ${
                        isDark ? 'border-slate-600 bg-slate-900 text-slate-100' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                />
                <button type="button" disabled={processing} onClick={declineSubmit} className="sr-btn-action-danger w-full rounded-[12px] text-xs font-bold">
                    {t.declineBtn}
                </button>
            </div>
        </div>
    );
}
