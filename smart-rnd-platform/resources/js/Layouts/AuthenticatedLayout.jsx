import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import UiControls from '@/Components/UiControls';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    Building2,
    CalendarRange,
    ChevronDown,
    ChevronsLeft,
    ChevronsRight,
    ClipboardCheck,
    ClipboardList,
    LayoutDashboard,
    LayoutPanelLeft,
    Link2,
    ListChecks,
    ListTodo,
    Menu,
    MessagesSquare,
    Monitor,
    Radar,
    Upload,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function BrandWordmark({ isDark, isArabic, compact = false }) {
    const bridgeClass = `${compact ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 text-[#19A7CE]`;

    return (
        <span className="inline-flex min-w-0 items-center gap-2">
            <Link2 className={bridgeClass} aria-hidden />
            <span className={`font-black ${compact ? 'text-xs sm:text-sm' : 'text-sm'} ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                {isArabic ? (
                    <>
                        جسر الابتكار
                        <span className="mx-1 font-semibold text-[#19A7CE]">|</span>
                        <span className="text-[#19A7CE]">InnoBridge</span>
                    </>
                ) : (
                    <>
                        <span className="text-[#19A7CE]">InnoBridge</span>
                        <span className="mx-1 font-semibold text-slate-400">|</span>
                        Innovation Bridge
                    </>
                )}
            </span>
        </span>
    );
}

function NavGlyph({ Icon }) {
    return <Icon className="h-5 w-5 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />;
}

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const impersonation = page.props.impersonation;
    const showAdminTools = user?.role === 'admin' && !impersonation?.active;
    const supervisorMeta = page.props.supervisorMeta;
    const hodMeta = page.props.hodMeta;
    const pendingIndustryNominationsCount = hodMeta?.pending_industry_nominations_count ?? 0;
    const groupChatUnreadCount = page.props.groupChatUnreadCount ?? 0;
    const inboxUnreadTotal = page.props.inboxUnreadTotal ?? groupChatUnreadCount;
    const pendingChallengeRequestsCount = supervisorMeta?.pending_challenge_requests_count ?? 0;
    const facultyModules = page.props.facultyModules ?? {};
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { isArabic, isDark, toggleLanguage, toggleTheme } = useUiPreferences();

    const showSupervisorNav = ['supervisor', 'admin'].includes(user?.role);
    const showHoDNav = user?.role === 'hod';
    const isIndustryUser = user?.role === 'industry';
    const t = useMemo(
        () =>
            isArabic
                ? {
                      dashboard: 'لوحة التحكم',
                      reviewQueue: 'لوحة المتابعة',
                      students: 'فرق الطلاب',
                      groups: 'المجموعات',
                      notifications: 'الإشعارات',
                      milestones: 'المراحل',
                      uploads: 'رفع الملفات',
                      myTeam: 'فريقي',
                      workspace: 'مساحة العمل',
                      industryChallenges: 'تحديات الصناعة',
                      pendingChallengeRequests: 'طلبات التحديات',
                      hodPanel: 'لوحة رئيس القسم',
                      hodIndustryChallengeReview: 'مراجعة تحديات الصناعة',
                      hodIndustryNominations: 'اعتماد اختيار الشركة',
                      teamsMonitor: 'مراقبة الفرق',
                      reportsExport: 'تقارير الأداء',
                      projectTimeline: 'المخطط الزمني للمشاريع',
                      collapseSidebar: 'تصغير القائمة',
                      expandSidebar: 'توسيع القائمة',
                      openMenu: 'فتح القائمة',
                      closeMenu: 'إغلاق القائمة',
                      adminOverview: 'لوحة المسؤول',
                      adminUsers: 'المستخدمون',
                      impersonationHint: 'أنت تعرض المنصة كمستخدم آخر.',
                      impersonationAdmin: 'مسؤول المنصة',
                      impersonationLeave: 'العودة لحساب المسؤول',
                      back: 'عودة',
                      profile: 'الملف الشخصي',
                      logout: 'تسجيل الخروج',
                      role: 'الدور',
                      lang: 'EN',
                      theme: isDark ? 'Light' : 'Dark',
                  }
                : {
                      dashboard: 'Dashboard',
                      reviewQueue: 'Tracking Panel',
                      students: 'Student Teams',
                      groups: 'Groups',
                      notifications: 'Notifications',
                      milestones: 'Milestones',
                      uploads: 'Uploads',
                      myTeam: 'My Team',
                      workspace: 'Workspace',
                      industryChallenges: 'Industry Challenges',
                      pendingChallengeRequests: 'Challenge Requests',
                      hodPanel: 'HoD Panel',
                      hodIndustryChallengeReview: 'Industry challenge review',
                      hodIndustryNominations: 'Confirm company pick',
                      teamsMonitor: 'Teams Monitor',
                      reportsExport: 'Performance reports',
                      projectTimeline: 'Project timeline',
                      collapseSidebar: 'Collapse Menu',
                      expandSidebar: 'Expand Menu',
                      openMenu: 'Open menu',
                      closeMenu: 'Close menu',
                      adminOverview: 'Admin overview',
                      adminUsers: 'Users',
                      impersonationHint: 'You are viewing as another account.',
                      impersonationAdmin: 'Platform admin',
                      impersonationLeave: 'Return to admin',
                      back: 'Back',
                      profile: 'Profile',
                      logout: 'Log Out',
                      role: 'Role',
                      lang: 'عربي',
                      theme: isDark ? 'Light' : 'Dark',
                  },
        [isArabic, isDark],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = window.localStorage.getItem('srnd_sidebar_collapsed');
        setIsSidebarCollapsed(saved === '1');
    }, []);

    useEffect(() => {
        setShowingNavigationDropdown(false);
    }, [page.url]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('srnd_sidebar_collapsed', next ? '1' : '0');
            }
            return next;
        });
    };

    const INDUSTRY_CHROME_PAGES = [
        'Industry/Portal',
        'Supervisor/HodIndustryNominations',
        'Supervisor/HodIndustryChallenges',
        'Student/IndustryChallenges',
    ];

    const industryChromeShell =
        typeof page.component === 'string' && INDUSTRY_CHROME_PAGES.includes(page.component);

    /** Must follow the user theme toggle only — forcing dark on industry routes made «light» appear broken. */
    const chromeDark = isDark;

    const sidebarActiveClass = industryChromeShell
        ? 'sr-sidebar-link-active-brand text-white shadow-lg'
        : 'bg-blue-600 text-white shadow-sm';

    const dashboardHref =
        user?.role === 'admin' && !impersonation?.active ? route('admin.overview') : route('dashboard');

    const dashboardRouteActive =
        user?.role === 'admin' && !impersonation?.active
            ? route().current('admin.overview')
            : route().current('dashboard');

    const handleBack = () => {
        if (showSupervisorNav) {
            window.location.href = dashboardHref;
            return;
        }

        if (showHoDNav) {
            window.location.href = route('dashboard');
            return;
        }

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`min-h-screen transition-colors ${chromeDark ? 'bg-slate-950' : 'bg-gray-100'}`}
        >
            {impersonation?.active ? (
                <div
                    className={`border-b px-4 py-2.5 text-sm ${isDark ? 'border-amber-500/35 bg-amber-950/90 text-amber-50' : 'border-amber-200 bg-amber-50 text-amber-950'}`}
                    role="status"
                    aria-live="polite"
                >
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
                        <p className="font-medium leading-snug">
                            <span className="font-bold">{t.impersonationHint}</span>
                            {impersonation?.adminName ? (
                                <>
                                    {' '}
                                    <span className="opacity-90">
                                        ({t.impersonationAdmin}: {impersonation.adminName})
                                    </span>
                                </>
                            ) : null}
                        </p>
                        <button
                            type="button"
                            onClick={() => router.post(route('admin.impersonate.leave'))}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                                isDark
                                    ? 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                                    : 'bg-amber-800 text-white hover:bg-amber-900'
                            }`}
                        >
                            {t.impersonationLeave}
                        </button>
                    </div>
                </div>
            ) : null}
            <nav className={`border-b ${chromeDark ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="h-16 grid grid-cols-[auto_auto_1fr] items-center gap-4" dir="ltr">
                        <div className="flex items-center">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <BrandWordmark isDark={chromeDark} isArabic={isArabic} />
                            </Link>
                        </div>

                        <div className="hidden sm:flex items-center justify-start gap-3">
                            <button
                                onClick={handleBack}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    chromeDark
                                        ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span>{isArabic ? '→' : '←'}</span>
                                <span>{t.back}</span>
                            </button>
                            <NavLink href={dashboardHref} active={dashboardRouteActive}>
                                {t.dashboard}
                            </NavLink>
                        </div>

                        <div className="flex items-center gap-2 justify-self-end">
                            <button
                                type="button"
                                aria-label={showingNavigationDropdown ? t.closeMenu : t.openMenu}
                                aria-expanded={showingNavigationDropdown}
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className={`inline-flex items-center justify-center rounded-md p-2 transition lg:hidden ${
                                    chromeDark
                                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                            >
                                {showingNavigationDropdown ? (
                                    <X className="h-6 w-6" strokeWidth={2} aria-hidden />
                                ) : (
                                    <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
                                )}
                            </button>
                            <div className="hidden sm:flex items-center gap-2">
                                <UiControls
                                    isDark={isDark}
                                    isArabic={isArabic}
                                    toggleLanguage={toggleLanguage}
                                    toggleTheme={toggleTheme}
                                    compact
                                />
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                                                        chromeDark
                                                            ? 'bg-slate-900 text-slate-200 hover:text-white'
                                                            : 'bg-white text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    {user.name}
                                                    <span className={`mx-2 text-xs ${chromeDark ? 'text-slate-400' : 'text-gray-400'}`}>
                                                        ({t.role}: {user.role})
                                                    </span>
                                                    <ChevronDown className="-me-0.5 ms-2 h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('profile.edit')}>{t.profile}</Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button">
                                                {t.logout}
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Drawer: all viewports below lg — desktop uses fixed sidebar */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} lg:hidden fixed inset-0 z-50`}>
                    <button
                        type="button"
                        aria-label={t.closeMenu}
                        onClick={() => setShowingNavigationDropdown(false)}
                        className="absolute inset-0 bg-black/50"
                    />
                    <div
                        className={`absolute top-0 ${isArabic ? 'right-0' : 'left-0'} h-full w-80 max-w-[85vw] shadow-2xl border ${
                            chromeDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
                        }`}
                    >
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <BrandWordmark isDark={chromeDark} isArabic={isArabic} compact />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowingNavigationDropdown(false)}
                                className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border transition ${
                                    chromeDark
                                        ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </button>
                        </div>

                        <div className="px-3 pb-3 space-y-1">
                            <button
                                onClick={() => {
                                    setShowingNavigationDropdown(false);
                                    handleBack();
                                }}
                                className={`w-full inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold border transition ${
                                    chromeDark
                                        ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span>{isArabic ? '→' : '←'}</span>
                                <span>{t.back}</span>
                            </button>

                            <ResponsiveNavLink href={dashboardHref} active={dashboardRouteActive}>
                                {t.dashboard}
                            </ResponsiveNavLink>

                            {showAdminTools ? (
                                <>
                                    <ResponsiveNavLink href={route('admin.overview')} active={route().current('admin.overview')}>
                                        {t.adminOverview}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('admin.users.index')} active={route().current('admin.users.index')}>
                                        {t.adminUsers}
                                    </ResponsiveNavLink>
                                </>
                            ) : null}

                            {showSupervisorNav ? (
                                <>
                                    <ResponsiveNavLink href={route('supervisor.students')} active={route().current('supervisor.students')}>
                                        {t.students}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('supervisor.milestones')} active={route().current('supervisor.milestones')}>
                                        {t.milestones}
                                    </ResponsiveNavLink>
                                    {facultyModules?.canExportReports ? (
                                        <ResponsiveNavLink href={route('faculty.reports.export')} active={route().current('faculty.reports.export')}>
                                            {t.reportsExport}
                                        </ResponsiveNavLink>
                                    ) : null}
                                    {facultyModules?.canSupervisorGantt ? (
                                        <ResponsiveNavLink
                                            href={route('supervisor.project.timeline')}
                                            active={route().current('supervisor.project.timeline')}
                                        >
                                            {t.projectTimeline}
                                        </ResponsiveNavLink>
                                    ) : null}
                                    <ResponsiveNavLink href={route('supervisor.requests')} active={route().current('supervisor.requests')}>
                                        {t.reviewQueue} ({supervisorMeta?.review_queue_count ?? 0})
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        href={route('supervisor.groups.index')}
                                        active={route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')}
                                    >
                                        {t.groups}
                                        {groupChatUnreadCount > 0 ? ` (${groupChatUnreadCount})` : ''}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('notifications.index')} active={route().current('notifications.index')}>
                                        {t.notifications}
                                        {inboxUnreadTotal > 0 ? ` (${inboxUnreadTotal})` : ''}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('supervisor.challenge-requests.pending')} active={route().current('supervisor.challenge-requests.pending')}>
                                        {t.pendingChallengeRequests}
                                        {pendingChallengeRequestsCount > 0 ? ` (${pendingChallengeRequestsCount})` : ''}
                                    </ResponsiveNavLink>
                                    {user?.role === 'admin' ? (
                                        <>
                                            <ResponsiveNavLink href={route('hod.panel')} active={route().current('hod.panel')}>
                                                {t.hodPanel}
                                            </ResponsiveNavLink>
                                            <ResponsiveNavLink
                                                href={route('hod.industry-challenges')}
                                                active={
                                                    route().current('hod.industry-challenges') ||
                                                    route().current('hod.industry-challenges.publish') ||
                                                    route().current('hod.industry-challenges.review')
                                                }
                                            >
                                                {t.hodIndustryChallengeReview}
                                            </ResponsiveNavLink>
                                            <ResponsiveNavLink
                                                href={route('hod.industry-nominations.index')}
                                                active={
                                                    route().current('hod.industry-nominations.index') ||
                                                    route().current('hod.industry-nominations.nominate') ||
                                                    route().current('hod.industry-requests.decline-from-pool')
                                                }
                                            >
                                                {t.hodIndustryNominations}
                                                {pendingIndustryNominationsCount > 0 ? ` (${pendingIndustryNominationsCount})` : ''}
                                            </ResponsiveNavLink>
                                        </>
                                    ) : null}
                                </>
                            ) : showHoDNav ? (
                                <>
                                    <ResponsiveNavLink href={route('hod.panel')} active={route().current('hod.panel')}>
                                        {t.hodPanel}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        href={route('hod.industry-challenges')}
                                        active={
                                            route().current('hod.industry-challenges') ||
                                            route().current('hod.industry-challenges.publish') ||
                                            route().current('hod.industry-challenges.review')
                                        }
                                    >
                                        {t.hodIndustryChallengeReview}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        href={route('hod.industry-nominations.index')}
                                        active={
                                            route().current('hod.industry-nominations.index') ||
                                        route().current('hod.industry-nominations.nominate') ||
                                        route().current('hod.industry-requests.decline-from-pool')
                                        }
                                    >
                                        {t.hodIndustryNominations}
                                        {pendingIndustryNominationsCount > 0 ? ` (${pendingIndustryNominationsCount})` : ''}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('hod.teams.monitor')} active={route().current('hod.teams.monitor')}>
                                        {t.teamsMonitor}
                                    </ResponsiveNavLink>
                                    {facultyModules?.canExportReports ? (
                                        <ResponsiveNavLink href={route('faculty.reports.export')} active={route().current('faculty.reports.export')}>
                                            {t.reportsExport}
                                        </ResponsiveNavLink>
                                    ) : null}
                                    <ResponsiveNavLink href={route('notifications.index')} active={route().current('notifications.index')}>
                                        {t.notifications}
                                        {inboxUnreadTotal > 0 ? ` (${inboxUnreadTotal})` : ''}
                                    </ResponsiveNavLink>
                                </>
                            ) : isIndustryUser ? (
                                <>
                                    <ResponsiveNavLink href={route('industry.portal')} active={route().current('industry.portal')}>
                                        {isArabic ? 'التحديات' : 'Challenges'}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('notifications.index')} active={route().current('notifications.index')}>
                                        {t.notifications}
                                        {inboxUnreadTotal > 0 ? ` (${inboxUnreadTotal})` : ''}
                                    </ResponsiveNavLink>
                                </>
                            ) : (
                                <>
                                    <ResponsiveNavLink href={route('student.team')} active={route().current('student.team')}>
                                        {t.myTeam}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('student.workspace')} active={route().current('student.workspace')}>
                                        {t.workspace}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('milestones.index')} active={route().current('milestones.index')}>
                                        {t.milestones}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('student.uploads')} active={route().current('student.uploads')}>
                                        {t.uploads}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('student.industry-challenges')} active={route().current('student.industry-challenges')}>
                                        {t.industryChallenges}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('notifications.index')} active={route().current('notifications.index')}>
                                        {t.notifications}
                                        {inboxUnreadTotal > 0 ? ` (${inboxUnreadTotal})` : ''}
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        href={route('supervisor.groups.index')}
                                        active={route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')}
                                    >
                                        {t.groups}
                                        {groupChatUnreadCount > 0 ? ` (${groupChatUnreadCount})` : ''}
                                    </ResponsiveNavLink>
                                </>
                            )}
                        </div>

                        <div className={`border-t ${chromeDark ? 'border-slate-800' : 'border-gray-200'} p-4`}>
                            <div className={`text-base font-medium ${chromeDark ? 'text-slate-100' : 'text-gray-800'}`}>{user.name}</div>
                            <div className={`text-sm font-medium ${chromeDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</div>
                            <div className="mt-3">
                                <UiControls isDark={isDark} isArabic={isArabic} toggleLanguage={toggleLanguage} toggleTheme={toggleTheme} compact />
                            </div>
                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink href={route('profile.edit')}>{t.profile}</ResponsiveNavLink>
                                <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                    {t.logout}
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className={`${chromeDark ? 'bg-slate-900 shadow-slate-900/40' : 'bg-white shadow'} shadow`}>
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <div className="flex">
                <aside
                    className={`hidden lg:block min-h-[calc(100vh-8rem)] border-e transition-all duration-300 ease-in-out ${
                        isSidebarCollapsed ? 'w-20' : 'w-64'
                    } ${chromeDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}
                >
                    <div className="p-3 space-y-2">
                        <div className={`mb-2 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                {!isSidebarCollapsed ? (
                                    <BrandWordmark isDark={chromeDark} isArabic={isArabic} compact />
                                ) : (
                                    <Link2 className={`h-8 w-8 shrink-0 text-[#19A7CE]`} aria-hidden />
                                )}
                            </div>
                            <button
                                onClick={toggleSidebar}
                                title={isSidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
                                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border transition ${
                                    chromeDark
                                        ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {isSidebarCollapsed ? (
                                    <ChevronsRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                                ) : (
                                    <ChevronsLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                                )}
                            </button>
                        </div>

                        <Link
                            href={dashboardHref}
                            className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                dashboardRouteActive
                                    ? sidebarActiveClass
                                    : chromeDark
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-gray-700 hover:bg-gray-100'
                            } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                        >
                            <NavGlyph Icon={LayoutDashboard} />
                            {!isSidebarCollapsed && <span className="ms-2">{t.dashboard}</span>}
                        </Link>

                        {showAdminTools ? (
                            <>
                                <Link
                                    href={route('admin.overview')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('admin.overview')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={LayoutPanelLeft} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.adminOverview}</span>}
                                </Link>
                                <Link
                                    href={route('admin.users.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('admin.users.index')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={UsersRound} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.adminUsers}</span>}
                                </Link>
                            </>
                        ) : null}

                        {showSupervisorNav ? (
                            <>
                                <Link
                                    href={route('supervisor.students')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.students')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={UsersRound} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.students}</span>}
                                </Link>

                                <Link
                                    href={route('supervisor.milestones')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.milestones')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={ListChecks} />
                                        {!isSidebarCollapsed && <span>{t.milestones}</span>}
                                    </span>
                                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                        {supervisorMeta?.review_queue_count ?? 0}
                                    </span>
                                </Link>
                                {facultyModules?.canExportReports ? (
                                    <Link
                                        href={route('faculty.reports.export')}
                                        className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                            route().current('faculty.reports.export')
                                                ? sidebarActiveClass
                                                : chromeDark
                                                  ? 'text-slate-200 hover:bg-slate-800'
                                                  : 'text-gray-700 hover:bg-gray-100'
                                        } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                    >
                                        <NavGlyph Icon={BarChart3} />
                                        {!isSidebarCollapsed && <span className="ms-2">{t.reportsExport}</span>}
                                    </Link>
                                ) : null}
                                {facultyModules?.canSupervisorGantt ? (
                                    <Link
                                        href={route('supervisor.project.timeline')}
                                        className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                            route().current('supervisor.project.timeline')
                                                ? sidebarActiveClass
                                                : chromeDark
                                                  ? 'text-slate-200 hover:bg-slate-800'
                                                  : 'text-gray-700 hover:bg-gray-100'
                                        } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                    >
                                        <NavGlyph Icon={CalendarRange} />
                                        {!isSidebarCollapsed && <span className="ms-2">{t.projectTimeline}</span>}
                                    </Link>
                                ) : null}
                                <Link
                                    href={route('supervisor.requests')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.requests')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={ClipboardList} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.reviewQueue}</span>}
                                </Link>

                                <Link
                                    href={route('supervisor.groups.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={MessagesSquare} />
                                        {!isSidebarCollapsed && <span>{t.groups}</span>}
                                    </span>
                                    {!isSidebarCollapsed && groupChatUnreadCount > 0 && (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] px-1">
                                            {groupChatUnreadCount}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    href={route('notifications.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('notifications.index')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={Bell} />
                                        {!isSidebarCollapsed && <span>{t.notifications}</span>}
                                    </span>
                                    {inboxUnreadTotal > 0 ? (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                            {inboxUnreadTotal}
                                        </span>
                                    ) : null}
                                </Link>

                                <Link
                                    href={route('supervisor.challenge-requests.pending')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.challenge-requests.pending')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={ListTodo} />
                                    {!isSidebarCollapsed && (
                                        <span className="ms-2 inline-flex items-center justify-between flex-1">
                                            <span>{t.pendingChallengeRequests}</span>
                                            {pendingChallengeRequestsCount > 0 && (
                                                <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] px-1">
                                                    {pendingChallengeRequestsCount}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </Link>

                                {user?.role === 'admin' ? (
                                    <>
                                        <Link
                                            href={route('hod.panel')}
                                            className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                                route().current('hod.panel')
                                                    ? sidebarActiveClass
                                                    : chromeDark
                                                      ? 'text-slate-200 hover:bg-slate-800'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                            } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                        >
                                            <NavGlyph Icon={LayoutPanelLeft} />
                                            {!isSidebarCollapsed && <span className="ms-2">{t.hodPanel}</span>}
                                        </Link>
                                        <Link
                                            href={route('hod.industry-challenges')}
                                            className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                                route().current('hod.industry-challenges') ||
                                                route().current('hod.industry-challenges.publish') ||
                                                route().current('hod.industry-challenges.review')
                                                    ? sidebarActiveClass
                                                    : chromeDark
                                                      ? 'text-slate-200 hover:bg-slate-800'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                            } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                        >
                                            <NavGlyph Icon={ClipboardCheck} />
                                            {!isSidebarCollapsed && <span className="ms-2">{t.hodIndustryChallengeReview}</span>}
                                        </Link>
                                        <Link
                                            href={route('hod.industry-nominations.index')}
                                            className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                                route().current('hod.industry-nominations.index') ||
                                                route().current('hod.industry-nominations.nominate') ||
                                                route().current('hod.industry-requests.decline-from-pool')
                                                    ? sidebarActiveClass
                                                    : chromeDark
                                                      ? 'text-slate-200 hover:bg-slate-800'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                            } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                        >
                                            <NavGlyph Icon={ListChecks} />
                                            {!isSidebarCollapsed && (
                                                <span className="ms-2 inline-flex items-center justify-between flex-1">
                                                    <span>{t.hodIndustryNominations}</span>
                                                    {pendingIndustryNominationsCount > 0 && (
                                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-teal-600 text-white text-[10px] px-1">
                                                            {pendingIndustryNominationsCount}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </Link>
                                    </>
                                ) : null}
                            </>
                        ) : showHoDNav ? (
                            <>
                                <Link
                                    href={route('hod.panel')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('hod.panel')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={LayoutPanelLeft} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.hodPanel}</span>}
                                </Link>

                                <Link
                                    href={route('hod.industry-challenges')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('hod.industry-challenges') ||
                                        route().current('hod.industry-challenges.publish') ||
                                        route().current('hod.industry-challenges.review')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={ClipboardCheck} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.hodIndustryChallengeReview}</span>}
                                </Link>

                                <Link
                                    href={route('hod.industry-nominations.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('hod.industry-nominations.index') ||
                                        route().current('hod.industry-nominations.nominate') ||
                                        route().current('hod.industry-requests.decline-from-pool')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={ListChecks} />
                                    {!isSidebarCollapsed && (
                                        <span className="ms-2 inline-flex items-center justify-between flex-1">
                                            <span>{t.hodIndustryNominations}</span>
                                            {pendingIndustryNominationsCount > 0 && (
                                                <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-teal-600 text-white text-[10px] px-1">
                                                    {pendingIndustryNominationsCount}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    href={route('hod.teams.monitor')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('hod.teams.monitor')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={Radar} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.teamsMonitor}</span>}
                                </Link>

                                {facultyModules?.canExportReports ? (
                                    <Link
                                        href={route('faculty.reports.export')}
                                        className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                            route().current('faculty.reports.export')
                                                ? sidebarActiveClass
                                                : chromeDark
                                                  ? 'text-slate-200 hover:bg-slate-800'
                                                  : 'text-gray-700 hover:bg-gray-100'
                                        } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                    >
                                        <NavGlyph Icon={BarChart3} />
                                        {!isSidebarCollapsed && <span className="ms-2">{t.reportsExport}</span>}
                                    </Link>
                                ) : null}

                                <Link
                                    href={route('notifications.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('notifications.index')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={Bell} />
                                        {!isSidebarCollapsed && <span>{t.notifications}</span>}
                                    </span>
                                    {!isSidebarCollapsed && inboxUnreadTotal > 0 ? (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                            {inboxUnreadTotal}
                                        </span>
                                    ) : null}
                                </Link>
                            </>
                        ) : isIndustryUser ? (
                            <>
                                <Link
                                    href={route('industry.portal')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('industry.portal')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={Building2} />
                                    {!isSidebarCollapsed && <span className="ms-2">{isArabic ? 'التحديات' : 'Challenges'}</span>}
                                </Link>
                                <Link
                                    href={route('notifications.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('notifications.index')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={Bell} />
                                        {!isSidebarCollapsed && <span>{t.notifications}</span>}
                                    </span>
                                    {!isSidebarCollapsed && inboxUnreadTotal > 0 ? (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                            {inboxUnreadTotal}
                                        </span>
                                    ) : null}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={route('student.team')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('student.team')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={UsersRound} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.myTeam}</span>}
                                </Link>
                                <Link
                                    href={route('student.workspace')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('student.workspace')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={Monitor} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.workspace}</span>}
                                </Link>
                                <Link
                                    href={route('milestones.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('milestones.index')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={ListChecks} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.milestones}</span>}
                                </Link>
                                <Link
                                    href={route('student.uploads')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('student.uploads')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={Upload} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.uploads}</span>}
                                </Link>
                                <Link
                                    href={route('supervisor.groups.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={MessagesSquare} />
                                        {!isSidebarCollapsed && <span>{t.groups}</span>}
                                    </span>
                                    {!isSidebarCollapsed && groupChatUnreadCount > 0 && (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] px-1">
                                            {groupChatUnreadCount}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    href={route('student.industry-challenges')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('student.industry-challenges')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <NavGlyph Icon={Building2} />
                                    {!isSidebarCollapsed && <span className="ms-2">{t.industryChallenges}</span>}
                                </Link>

                                <Link
                                    href={route('notifications.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('notifications.index')
                                            ? sidebarActiveClass
                                            : chromeDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <NavGlyph Icon={Bell} />
                                        {!isSidebarCollapsed && <span>{t.notifications}</span>}
                                    </span>
                                    {!isSidebarCollapsed && inboxUnreadTotal > 0 ? (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                            {inboxUnreadTotal}
                                        </span>
                                    ) : null}
                                </Link>
                            </>
                        )}
                    </div>
                </aside>
                <main className={`flex-1 ${industryChromeShell && isDark ? 'sr-panel-dark-shell' : ''}`}>{children}</main>
            </div>
        </div>
    );
}
