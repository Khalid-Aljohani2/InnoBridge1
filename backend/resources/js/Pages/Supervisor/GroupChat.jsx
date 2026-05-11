import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function GroupChat({
    group,
    messages = [],
    userGroupRole = 'member',
    canManage = false,
    availableStudents = [],
    availableSupervisors = [],
    selectedAdminIds = [],
}) {
    const { auth, flash } = usePage().props;
    const { isArabic, isDark } = useUiPreferences();
    const chatEndRef = useRef(null);
    const [showManagePanel, setShowManagePanel] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState(
        (group.members || []).map((m) => m.student_id).filter(Boolean),
    );
    const [selectedCoAdmins, setSelectedCoAdmins] = useState(selectedAdminIds);
    const { data, setData, post, processing } = useForm({
        message: '',
    });
    const groupMetaForm = useForm({
        name: group.name || '',
        description: group.description || '',
    });
    const membersForm = useForm({
        student_ids: (group.members || []).map((m) => m.student_id).filter(Boolean),
    });
    const adminsForm = useForm({
        admin_user_ids: selectedAdminIds,
    });

    const t = isArabic
        ? {
              title: 'محادثة المجموعة',
              members: 'الأعضاء',
              myRole: 'صلاحيتي',
              adminRole: 'Admin',
              memberRole: 'Member',
              manageTitle: 'إدارة القروب',
              nameLabel: 'اسم القروب',
              descLabel: 'الوصف',
              saveMeta: 'حفظ بيانات القروب',
              membersLabel: 'أعضاء القروب',
              saveMembers: 'حفظ الأعضاء',
              coAdminsLabel: 'المشرفون المشاركون (Co-admins)',
              saveCoAdmins: 'حفظ المشرفين المشاركين',
              deleteGroup: 'حذف القروب',
              deleteConfirm: 'هل أنت متأكد من حذف القروب؟ سيتم حذف المحادثة وكل الرسائل.',
              backToGroups: 'العودة إلى المجموعات',
              messagePlaceholder: 'اكتب رسالتك هنا...',
              send: 'إرسال',
              noMessages: 'لا توجد رسائل بعد. ابدأ المحادثة.',
              manageToggleOpen: 'فتح إعدادات وصلاحيات القروب',
              manageToggleClose: 'إخفاء إعدادات وصلاحيات القروب',
          }
        : {
              title: 'Group Chat',
              members: 'Members',
              myRole: 'My role',
              adminRole: 'Admin',
              memberRole: 'Member',
              manageTitle: 'Group Management',
              nameLabel: 'Group name',
              descLabel: 'Description',
              saveMeta: 'Save Group Details',
              membersLabel: 'Group Members',
              saveMembers: 'Save Members',
              coAdminsLabel: 'Co-admin Supervisors',
              saveCoAdmins: 'Save Co-admins',
              deleteGroup: 'Delete Group',
              deleteConfirm: 'Are you sure you want to delete this group? Chat and messages will be removed.',
              backToGroups: 'Back to groups',
              messagePlaceholder: 'Write your message...',
              send: 'Send',
              noMessages: 'No messages yet. Start the conversation.',
              manageToggleOpen: 'Open group settings & permissions',
              manageToggleClose: 'Hide group settings & permissions',
          };

    const selectedMembersSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);
    const selectedCoAdminsSet = useMemo(() => new Set(selectedCoAdmins), [selectedCoAdmins]);
    const managePanelStorageKey = useMemo(() => `srnd_group_manage_open_${group.id}`, [group.id]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    useEffect(() => {
        if (!canManage || typeof window === 'undefined') {
            setShowManagePanel(false);
            return;
        }

        const saved = window.localStorage.getItem(managePanelStorageKey);
        if (saved === null) {
            // First visit for admins: open settings panel by default.
            setShowManagePanel(true);
            window.localStorage.setItem(managePanelStorageKey, '1');
            return;
        }

        setShowManagePanel(saved === '1');
    }, [canManage, managePanelStorageKey]);

    const toggleManagePanel = () => {
        setShowManagePanel((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(managePanelStorageKey, next ? '1' : '0');
            }
            return next;
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('supervisor.groups.messages.store', group.id), {
            preserveScroll: true,
            onSuccess: () => setData('message', ''),
        });
    };

    const toggleMember = (studentId) => {
        setSelectedMembers((prev) =>
            prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
        );
    };

    const saveGroupMeta = (e) => {
        e.preventDefault();
        groupMetaForm.patch(route('supervisor.groups.update', group.id), {
            preserveScroll: true,
        });
    };

    const saveMembers = (e) => {
        e.preventDefault();
        membersForm.setData('student_ids', selectedMembers);
        membersForm.patch(route('supervisor.groups.members.sync', group.id), {
            preserveScroll: true,
        });
    };

    const toggleCoAdmin = (userId) => {
        setSelectedCoAdmins((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const saveCoAdmins = (e) => {
        e.preventDefault();
        adminsForm.setData('admin_user_ids', selectedCoAdmins);
        adminsForm.patch(route('supervisor.groups.admins.sync', group.id), {
            preserveScroll: true,
        });
    };

    const deleteGroup = () => {
        if (!window.confirm(t.deleteConfirm)) return;
        groupMetaForm.delete(route('supervisor.groups.destroy', group.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{group.name}</h2>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        {t.members}: {(group.members || []).map((m) => m.student?.name).filter(Boolean).join(', ')}
                    </p>
                </div>
            }
        >
            <Head title={`${t.title} - ${group.name}`} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack max-w-5xl">
                    {flash?.success && <div className="sr-alert-success">{flash.success}</div>}
                    {flash?.error && <div className="sr-alert-error">{flash.error}</div>}

                    <Link href={route('supervisor.groups.index')} className="sr-btn-action-neutral h-9 md:h-9 w-auto px-3 text-xs">
                        {t.backToGroups}
                    </Link>
                    <div className={`inline-flex ms-2 px-3 py-1.5 rounded-lg text-xs font-bold ${userGroupRole === 'admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {t.myRole}: {userGroupRole === 'admin' ? t.adminRole : t.memberRole}
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 h-[60vh] overflow-auto`}>
                        {messages.length === 0 ? (
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noMessages}</p>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg) => {
                                    const mine = Number(msg.sender_id) === Number(auth?.user?.id);
                                    return (
                                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                                                    mine
                                                        ? 'bg-blue-600 text-white'
                                                        : isDark
                                                          ? 'bg-slate-800 text-slate-100'
                                                          : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                <p className={`text-[11px] mb-1 font-semibold ${mine ? 'text-blue-100' : 'text-gray-500'}`}>{msg.sender?.name}</p>
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </div>

                    <form onSubmit={submit} className="flex gap-2">
                        <input
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            placeholder={t.messagePlaceholder}
                            className={`flex-1 rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        />
                        <button
                            type="submit"
                            disabled={processing || !data.message.trim()}
                            className="sr-btn-action-primary w-auto px-4 disabled:bg-gray-400"
                        >
                            {t.send}
                        </button>
                    </form>

                    {canManage && (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 space-y-4`}>
                            <button
                                type="button"
                                onClick={toggleManagePanel}
                                className={showManagePanel ? 'sr-btn-action-secondary' : 'sr-btn-action-neutral'}
                            >
                                {showManagePanel ? t.manageToggleClose : t.manageToggleOpen}
                            </button>

                            {showManagePanel && (
                                <div className="space-y-4" style={{ animation: 'srModalIn 180ms ease-out' }}>
                                    <h3 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.manageTitle}</h3>

                                    <form onSubmit={saveGroupMeta} className="space-y-2">
                                        <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.nameLabel}</label>
                                        <input
                                            value={groupMetaForm.data.name}
                                            onChange={(e) => groupMetaForm.setData('name', e.target.value)}
                                            className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                        />
                                        <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.descLabel}</label>
                                        <textarea
                                            value={groupMetaForm.data.description}
                                            onChange={(e) => groupMetaForm.setData('description', e.target.value)}
                                            className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                            rows="2"
                                        />
                                        <button className="sr-btn-action-secondary h-9 md:h-9 w-auto px-3 text-xs">
                                            {t.saveMeta}
                                        </button>
                                    </form>

                                    <form onSubmit={saveMembers} className="space-y-2">
                                        <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.membersLabel}</label>
                                        <div className={`max-h-48 overflow-auto rounded-lg border p-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                {availableStudents.map((student) => (
                                                    <label key={student.id} className={`flex items-center gap-2 rounded px-2 py-1 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMembersSet.has(student.id)}
                                                            onChange={() => toggleMember(student.id)}
                                                        />
                                                        <span className={`text-sm ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{student.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <button className="sr-btn-action-primary h-9 md:h-9 w-auto px-3 text-xs">
                                            {t.saveMembers}
                                        </button>
                                    </form>

                                    <form onSubmit={saveCoAdmins} className="space-y-2">
                                        <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.coAdminsLabel}</label>
                                        <div className={`max-h-40 overflow-auto rounded-lg border p-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                {availableSupervisors
                                                    .filter((u) => Number(u.id) !== Number(group.supervisor_id))
                                                    .map((sup) => (
                                                        <label key={sup.id} className={`flex items-center gap-2 rounded px-2 py-1 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCoAdminsSet.has(sup.id)}
                                                                onChange={() => toggleCoAdmin(sup.id)}
                                                            />
                                                            <span className={`text-sm ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                                                {sup.name} ({sup.role})
                                                            </span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>
                                        <button className="sr-btn-action h-9 md:h-9 w-auto px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                                            {t.saveCoAdmins}
                                        </button>
                                    </form>

                                    <button
                                        onClick={deleteGroup}
                                        className="sr-btn-action-danger h-9 md:h-9 w-auto px-3 text-xs"
                                    >
                                        {t.deleteGroup}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
