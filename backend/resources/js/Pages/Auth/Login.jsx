import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import UiControls from '@/Components/UiControls';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Briefcase, Building2, GraduationCap, KeyRound, Link2, Lock, Mail, UserPlus, UserCheck } from 'lucide-react';
import { useEffect } from 'react';

function LoginHeroPanel({ isArabic }) {
    const slogan = isArabic
        ? 'حيث تجد الشركات حلولها، ويصنع الطلاب مستقبلهم.'
        : 'Where companies find solutions—and students build their future.';

    return (
        <section
            className="relative hidden min-h-0 flex-1 flex-col justify-end overflow-hidden lg:flex"
            aria-hidden={false}
        >
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        'linear-gradient(135deg, rgba(11, 36, 71, 0.92) 0%, rgba(11, 36, 71, 0.75) 45%, rgba(16, 185, 129, 0.35) 100%), url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80)',
                }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(25,167,206,0.35),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.2),transparent_40%)]" />

            <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-16 xl:px-16">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200/90 backdrop-blur-sm">
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    <span>{isArabic ? 'جسر الابتكار' : 'InnoBridge'}</span>
                </div>
                <h2 className="max-w-xl text-balance text-3xl font-extrabold leading-tight text-white drop-shadow-sm xl:text-4xl">
                    {slogan}
                </h2>
                <p className="mt-6 max-w-md text-sm font-medium leading-relaxed text-slate-200/90">
                    {isArabic
                        ? 'بوابتكم لتحويل تحديات الأعمال إلى أصول ابتكارية عبر عقول أكاديمية مبدعة.'
                        : 'Your gateway from real business challenges to innovation assets—powered by academic talent.'}
                </p>
            </div>
        </section>
    );
}

export default function Login({ status, canResetPassword, intendedRole }) {
    const { isArabic, isDark, toggleLanguage, toggleTheme } = useUiPreferences();
    const passwordlessLoginEnabled = !!usePage().props.passwordlessLoginEnabled;
    const lockedRole = ['student', 'supervisor', 'hod', 'industry', 'admin'].includes(intendedRole) ? intendedRole : null;

    const t = isArabic
        ? {
              headTitle: 'تسجيل الدخول',
              title: 'مرحباً بعودتك',
              subtitle: 'سجّل الدخول إلى منصة جسر الابتكار.',
              tabIndustry: 'الشركات',
              tabStudent: 'الطلاب',
              tabSupervisor: 'المشرفون',
              tabHod: 'رؤساء الأقسام',
              tabAdmin: 'المسؤول',
              newFaculty: 'تسجيل حساب أكاديمي جديد',
              newStudent: 'تسجيل حساب طالب جديد',
              newIndustry: 'تسجيل حساب شركة جديد',
              roleLocked: 'الدور محدد من الرابط ولا يمكن تغييره.',
              email: 'البريد الإلكتروني',
              password: 'كلمة المرور',
              remember: 'تذكرني',
              forgotPassword: 'نسيت كلمة المرور؟',
              login: 'تسجيل الدخول',
              passwordlessHint: 'وضع الاختبار: يكفي إدخال البريد واختيار الدور، دون كلمة مرور.',
              home: 'الرئيسية',
              companyPitch: 'هل تريد حل مشكلة تقنية؟ سجل كشركة الآن',
          }
        : {
              headTitle: 'Log in',
              title: 'Welcome back',
              subtitle: 'Sign in to InnoBridge.',
              tabIndustry: 'Companies',
              tabStudent: 'Students',
              tabSupervisor: 'Supervisors',
              tabHod: 'HoD',
              tabAdmin: 'Admin',
              newFaculty: 'New academic account',
              newStudent: 'New student account',
              newIndustry: 'New company account',
              roleLocked: 'Role is fixed from the link you used.',
              email: 'Email address',
              password: 'Password',
              remember: 'Remember me',
              forgotPassword: 'Forgot password?',
              login: 'Sign in',
              passwordlessHint: 'Test mode: email and role only — no password required.',
              home: 'Home',
              companyPitch: 'Need a technical solution? Register as a company.',
          };

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        selected_role: lockedRole || 'student',
        login_locale: 'ar',
    });

    useEffect(() => {
        setData((prev) => ({ ...prev, login_locale: isArabic ? 'ar' : 'en' }));
    }, [isArabic, setData]);

    const setRole = (role) => {
        if (lockedRole) return;
        setData('selected_role', role);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const tabDefs = [
        { role: 'industry', label: t.tabIndustry, Icon: Briefcase },
        { role: 'student', label: t.tabStudent, Icon: GraduationCap },
        { role: 'supervisor', label: t.tabSupervisor, Icon: UserCheck },
        { role: 'hod', label: t.tabHod, Icon: Building2 },
    ];

    const inputShell = isDark
        ? 'w-full rounded-lg border border-slate-600 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 h-12'
        : 'w-full rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 h-12';

    /** Icons at inline-end: LTR → right, RTL → left; pad that side so text never overlaps. */
    const inputPadIconEnd = isArabic ? 'pl-11 pr-4' : 'pr-11 pl-4';
    const iconInlineEnd = isArabic ? 'left-3.5' : 'right-3.5';

    const formColumn = (
        <div
            className={`relative flex min-h-screen flex-1 flex-col justify-center px-5 py-12 sm:px-10 lg:max-w-none lg:px-14 xl:px-20 ${
                isDark ? 'bg-slate-950' : 'bg-slate-50'
            }`}
        >
            <div className="fixed right-4 top-4 z-[60] flex items-center gap-2" dir="ltr">
                <UiControls
                    isDark={isDark}
                    isArabic={isArabic}
                    toggleLanguage={toggleLanguage}
                    toggleTheme={toggleTheme}
                    compact
                    iconsOnly
                />
            </div>

            <div className={`mx-auto w-full max-w-md ${isArabic ? 'text-right' : 'text-left'}`}>
                <Link
                    href="/"
                    className={`mb-8 inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80 ${
                        isDark ? 'text-[#8ad9eb]' : 'text-[#0B2447]'
                    }`}
                >
                    <Link2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                    <span className="text-lg font-extrabold tracking-tight text-[#0B2447] dark:text-white">InnoBridge</span>
                    <span className="text-slate-400 dark:text-slate-500">|</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {isArabic ? 'جسر الابتكار' : 'Innovation Bridge'}
                    </span>
                </Link>

                <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {t.title}
                </h1>
                <p className={`mt-2 text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.subtitle}</p>

                {passwordlessLoginEnabled ? (
                    <p
                        className={`mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${
                            isDark ? 'border-amber-500/40 bg-amber-950/40 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-950'
                        }`}
                    >
                        {t.passwordlessHint}
                    </p>
                ) : null}

                {status ? <div className="mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{status}</div> : null}

                <div className="mt-8">
                    <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {isArabic ? 'نوع الدخول' : 'Sign-in as'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {tabDefs.map(({ role, label, Icon }) => {
                            const active = data.selected_role === role;
                            const disabled = Boolean(lockedRole);
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setRole(role)}
                                    className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center text-xs font-bold transition sm:min-h-[5.5rem] sm:text-sm ${
                                        active
                                            ? isDark
                                                ? 'border-emerald-500 bg-emerald-950/50 text-emerald-200'
                                                : 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                            : isDark
                                              ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    } ${disabled && !active ? 'opacity-50' : ''}`}
                                >
                                    <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-emerald-500' : 'text-slate-400'}`} aria-hidden />
                                    <span className="leading-tight">{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex min-h-[3rem] flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={Boolean(lockedRole) && lockedRole !== 'admin'}
                                onClick={() => {
                                    if (lockedRole) return;
                                    setRole('admin');
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${
                                    data.selected_role === 'admin'
                                        ? isDark
                                            ? 'border-violet-500 bg-violet-950/50 text-violet-200'
                                            : 'border-violet-600 bg-violet-50 text-violet-900'
                                        : isDark
                                          ? 'border-slate-700 text-slate-400 hover:border-slate-500 disabled:opacity-40'
                                          : 'border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40'
                                }`}
                            >
                                <KeyRound className="h-3.5 w-3.5" aria-hidden />
                                {t.tabAdmin}
                            </button>
                            {!lockedRole && (data.selected_role === 'supervisor' || data.selected_role === 'hod') ? (
                                <Link
                                    href={route('register', { role: 'faculty' })}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${
                                        isDark
                                            ? 'border-slate-600 text-slate-200 hover:border-emerald-500/60 hover:text-emerald-200'
                                            : 'border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                                    }`}
                                >
                                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                                    {t.newFaculty}
                                </Link>
                            ) : null}
                            {!lockedRole && data.selected_role === 'student' ? (
                                <Link
                                    href={route('register')}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${
                                        isDark
                                            ? 'border-slate-600 text-slate-200 hover:border-emerald-500/60 hover:text-emerald-200'
                                            : 'border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                                    }`}
                                >
                                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                                    {t.newStudent}
                                </Link>
                            ) : null}
                            {!lockedRole && data.selected_role === 'industry' ? (
                                <Link
                                    href={route('register.industry')}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${
                                        isDark
                                            ? 'border-slate-600 text-slate-200 hover:border-emerald-500/60 hover:text-emerald-200'
                                            : 'border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                                    }`}
                                >
                                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                                    {t.newIndustry}
                                </Link>
                            ) : null}
                        </div>

                    {lockedRole ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.roleLocked}</p>
                    ) : null}
                </div>

                <form onSubmit={submit} className="mt-8 space-y-5">
                    <div>
                        <InputLabel htmlFor="email" value={t.email} className={isDark ? 'text-slate-300' : ''} />
                        <div className="relative mt-2">
                            <Mail
                                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600/80 dark:text-emerald-400/90 ${iconInlineEnd}`}
                                aria-hidden
                            />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                className={`${inputShell} ${inputPadIconEnd}`}
                            />
                        </div>
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    {!passwordlessLoginEnabled ? (
                        <div>
                            <InputLabel htmlFor="password" value={t.password} className={isDark ? 'text-slate-300' : ''} />
                            <div className="relative mt-2">
                                <Lock
                                    className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600/80 dark:text-emerald-400/90 ${iconInlineEnd}`}
                                    aria-hidden
                                />
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`${inputShell} ${inputPadIconEnd}`}
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    ) : null}

                    <div className="flex items-center">
                        <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.remember}</span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {canResetPassword && !passwordlessLoginEnabled ? (
                            <Link
                                href={route('password.request')}
                                className={`text-sm font-semibold underline-offset-4 transition hover:underline ${
                                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {t.forgotPassword}
                            </Link>
                        ) : (
                            <span />
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className={`inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-extrabold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-40 sm:w-auto sm:min-w-[10rem] ${
                                isDark
                                    ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 focus:ring-offset-slate-950'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-offset-slate-50'
                            }`}
                        >
                            {t.login}
                        </button>
                    </div>

                    {isArabic && data.selected_role === 'industry' ? (
                        <p className="text-center text-xs font-semibold leading-relaxed text-emerald-700 dark:text-emerald-300/90">
                            هل تريد حل مشكلة تقنية؟{' '}
                            <Link href={route('register.industry')} className="underline decoration-emerald-500/70 underline-offset-2">
                                سجل كشركة الآن
                            </Link>
                        </p>
                    ) : !isArabic && data.selected_role === 'industry' ? (
                        <p className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300/90">
                            {t.companyPitch}{' '}
                            <Link href={route('register.industry')} className="underline underline-offset-2">
                                Register
                            </Link>
                        </p>
                    ) : null}
                </form>

                <p className={`mt-10 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                        <span aria-hidden>{isArabic ? '→' : '←'}</span>
                        {t.home}
                    </Link>
                </p>
            </div>
        </div>
    );

    const heroColumn = <LoginHeroPanel isArabic={isArabic} />;

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`min-h-screen font-['Tajawal','Cairo','Inter',sans-serif] antialiased ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
        >
            <Head title={t.headTitle} />

            <div className="flex min-h-screen flex-col lg:flex-row">
                {isArabic ? (
                    <>
                        {formColumn}
                        {heroColumn}
                    </>
                ) : (
                    <>
                        {heroColumn}
                        {formColumn}
                    </>
                )}
            </div>
        </div>
    );
}
