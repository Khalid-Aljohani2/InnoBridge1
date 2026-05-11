import AuroraBackground from '@/Components/AuroraBackground';
import MarketingFooter from '@/Components/marketing/MarketingFooter';
import MarketingHeader from '@/Components/marketing/MarketingHeader';
import SplashScreen, { INNOBRIDGE_SPLASH_KEY } from '@/Components/SplashScreen';
import { Head, Link } from '@inertiajs/react';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Briefcase, GraduationCap, Lightbulb, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const INTRO_KEY = 'innobridge_welcome_intro_v1';

const content = {
    ar: {
        mainSlogan: 'حيث تجد الشركات حلولها، ويصنع الطلاب مستقبلهم.',
        subSlogan: 'بوابتكم لتحويل تحديات الأعمال إلى أصول ابتكارية.',
        ecosystemDesc:
            'نحن نربط التحديات الواقعية للقطاع الخاص بالعقول الأكاديمية المبدعة لإنتاج حلول ذكية.',
        card1Title: 'منظومة متكاملة',
        card1Desc: 'ربط الشركات بالطلاب وبإشراك الأكاديميين لمشاكل حقيقية ونتائج قابلة للتطبيق.',
        card2Title: 'مسار ابتكار واضح',
        card2Desc: 'مراحل، تسليمات، وتقييمات تضمن تحوّل الفكرة إلى أصل ابتكاري.',
        card3Title: 'أثر يمتدّ',
        card3Desc: 'الحلول تصبح معرفة متراكمة تخدم الدفعات التالية والقطاع ذاته.',
        startBtn: 'استكشاف المنظومة',
        rolesBtn: 'استعراض الأدوار',
        goDashboard: 'الانتقال إلى لوحة التحكم',
        ecosystemBadge: 'المنظومة',
        roleTitlePrimary: 'جسر الابتكار',
        roleTitleAccent: 'InnoBridge',
        roleDesc:
            'منصة واحدة تجمع طرفي المعادلة — تحديات من القطاع وحلول من العقول الأكاديمية — لتسريع الابتكار الملموس.',
        students: 'الطلاب والمبتكرون',
        studentsDesc: 'انطلقوا من مشكلة حقيقية، وقدّموا حلولا ذكية تُقاس بأثرها.',
        instructors: 'الأكاديميون',
        instructorsDesc: 'أشرفوا، وَوجّهوا، واختزلوا مسافة الشركات بالطاقات البحثية لديكم.',
        industry: 'الشركات والقطاع الخاص',
        industryDesc: 'اطرحوا تحدياتكم، واحصلوا على حلول مبتكرة من فرق أكاديمية منظّمة.',
        joinUs: 'انضم إلينا',
        joinUsHint: 'تسجيل الدخول الموحّد من هذا الزر فقط. لتسجيل حساب جديد، اختر نوع الانضمام من البطاقة أعلاه.',
        registerStudent: 'حساب طالب',
        registerFaculty: 'حساب أكاديمي',
        registerCompany: 'حساب شركة',
        backToIntro: 'الرجوع لصفحة الترحيب',
        aboutUs: 'من نحن',
    },
    en: {
        mainSlogan: 'Where companies find solutions—and students forge their futures.',
        subSlogan: 'Your gateway to turning business challenges into innovation assets.',
        ecosystemDesc:
            'We connect real private-sector challenges with creative academic minds to produce smart, impactful solutions.',
        card1Title: 'Connected ecosystem',
        card1Desc: 'Companies meet student teams—with faculty—for problems that deserve real-world answers.',
        card2Title: 'Clear innovation path',
        card2Desc: 'Milestones, submissions, and reviews that turn insight into tangible outcomes.',
        card3Title: 'Lasting impact',
        card3Desc: 'Outcomes accumulate as reusable knowledge for the next cohort—and for industry.',
        startBtn: 'Explore the ecosystem',
        rolesBtn: 'Explore roles',
        goDashboard: 'Go to dashboard',
        ecosystemBadge: 'Ecosystem',
        roleTitlePrimary: 'Innovation Bridge',
        roleTitleAccent: 'InnoBridge',
        roleDesc:
            'One platform aligning industry challenges with academic talent—moving ideas from sketch to scalable value.',
        students: 'Students & innovators',
        studentsDesc: 'Start from a real constraint and ship smart solutions with measurable outcomes.',
        instructors: 'Faculty',
        instructorsDesc: 'Guide teams and shorten the gap between labs and labour-market needs.',
        industry: 'Companies & sector',
        industryDesc: 'Post challenges and receive structured innovations from supervised academic teams.',
        joinUs: 'Join us',
        joinUsHint: 'Sign in happens only via this unified button. To create an account, use the signup option for your role on a card above.',
        registerStudent: 'Student signup',
        registerFaculty: 'Faculty signup',
        registerCompany: 'Company signup',
        backToIntro: 'Back to intro',
        aboutUs: 'About',
    },
};

export default function Welcome({ auth }) {
    const [showSplash, setShowSplash] = useState(true);
    const [showIntro, setShowIntro] = useState(true);
    const { lang, isArabic, isDark } = useUiPreferences();

    const completeSplash = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(INNOBRIDGE_SPLASH_KEY, '1');
        }
        setShowSplash(false);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (auth?.user) {
            setShowSplash(false);
            return;
        }
        const params = new URLSearchParams(window.location.search);
        if (params.get('splash') === '1') {
            return;
        }
        if (window.localStorage.getItem(INNOBRIDGE_SPLASH_KEY) === '1') {
            setShowSplash(false);
        }
    }, [auth?.user]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const forceAbout = params.get('about') === '1';
        if (forceAbout) {
            setShowIntro(true);
            return;
        }
        if (window.localStorage.getItem(INTRO_KEY) === '1') {
            setShowIntro(false);
        }
    }, []);

    const t = useMemo(() => content[lang], [lang]);

    const startExperience = () => {
        setShowIntro(false);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(INTRO_KEY, '1');
        }
    };

    const roleCards = useMemo(
        () => [
            {
                id: 'students',
                anchorId: 'students',
                Icon: Lightbulb,
                iconWrap: 'from-[#0B2447] to-[#19A7CE]',
                title: t.students,
                desc: t.studentsDesc,
            },
            {
                id: 'supervisor',
                anchorId: 'faculty',
                Icon: UsersRound,
                iconWrap: 'from-[#19A7CE] to-[#10B981]',
                title: t.instructors,
                desc: t.instructorsDesc,
            },
            {
                id: 'industry',
                anchorId: 'industry',
                Icon: Briefcase,
                iconWrap: 'from-[#10B981] to-[#0B2447]',
                title: t.industry,
                desc: t.industryDesc,
            },
        ],
        [t],
    );

    if (showSplash && !auth?.user) {
        return <SplashScreen isArabic={isArabic} isDark={isDark} onDone={completeSplash} />;
    }

    return (
        <>
            <Head title={`${isArabic ? 'جسر الابتكار' : 'InnoBridge'} — Innovation Bridge`} />

            <div
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`relative flex min-h-screen flex-col overflow-hidden transition-all duration-500 ${
                    isDark ? 'sr-app-bg-dark' : 'sr-app-bg'
                }`}
            >
                <AuroraBackground isDark={isDark} />

                <div className="relative z-10 flex min-h-screen flex-col">
                    <MarketingHeader />

                    <main className="flex flex-1 flex-col px-4 py-8 pb-16 md:px-6 md:pb-24">
                        {showIntro ? (
                            <div className="relative z-10 mx-auto mt-6 w-full max-w-6xl flex-1">
                                <div
                                    id="platform-intro"
                                    className={`rounded-3xl border p-8 shadow-2xl backdrop-blur-xl transition md:p-12 ${
                                        isDark ? 'border-slate-700 bg-slate-900/80' : 'border-white/80 bg-white/90'
                                    }`}
                                >
                                    <p
                                        className={`mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm ${
                                            isDark ? 'border-[#19A7CE]/40 bg-[#0B2447]/40 text-slate-100' : 'border-[#19A7CE]/30 bg-[#19A7CE]/10 text-[#0B2447]'
                                        }`}
                                    >
                                        <span>{isArabic ? 'جسر الابتكار' : 'InnoBridge'}</span>
                                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>|</span>
                                        <span className="text-[#19A7CE]">{isArabic ? 'InnoBridge' : 'Innovation Bridge'}</span>
                                    </p>

                                    <p className={`mb-8 text-base font-semibold leading-relaxed md:text-lg ${isDark ? 'text-[#b7ebff]' : 'text-[#0B2447]'}`}>
                                        {t.subSlogan}
                                    </p>

                                    <h1 className={`mb-6 text-balance text-3xl font-black leading-snug md:text-5xl md:leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                        {t.mainSlogan}
                                    </h1>

                                    <p className={`mb-10 max-w-4xl text-pretty text-lg leading-relaxed md:text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.ecosystemDesc}</p>

                                    <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div
                                            className={`rounded-2xl border p-5 ${isDark ? 'border-[#0B2447]/60 bg-[#0B2447]/30' : 'border-[#19A7CE]/25 bg-[#19A7CE]/10'} sr-card-hover`}
                                        >
                                            <h3 className={`mb-2 flex items-center gap-2 font-bold ${isDark ? 'text-[#8ad9eb]' : 'text-[#0B2447]'}`}>
                                                <GraduationCap className="h-5 w-5 text-[#19A7CE]" aria-hidden />
                                                {t.card1Title}
                                            </h3>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.card1Desc}</p>
                                        </div>
                                        <div
                                            className={`rounded-2xl border p-5 ${isDark ? 'border-emerald-900/50 bg-emerald-950/40' : 'border-emerald-100 bg-emerald-50/70'} sr-card-hover`}
                                        >
                                            <h3 className={`mb-2 flex items-center gap-2 font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>
                                                <Lightbulb className="h-5 w-5 text-emerald-500" aria-hidden />
                                                {t.card2Title}
                                            </h3>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{t.card2Desc}</p>
                                        </div>
                                        <div
                                            className={`rounded-2xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50/90'} sr-card-hover`}
                                        >
                                            <h3 className={`mb-2 flex items-center gap-2 font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                                <Briefcase className="h-5 w-5 text-[#0B2447] dark:text-slate-200" aria-hidden />
                                                {t.card3Title}
                                            </h3>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.card3Desc}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <button type="button" onClick={startExperience} className="sr-btn-action-primary w-auto px-10">
                                            {t.startBtn}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative z-10 mx-auto mb-14 max-w-4xl px-2 text-center">
                                    <p
                                        className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-bold shadow-sm ${
                                            isDark ? 'border-[#19A7CE]/40 bg-[#0B2447]/40 text-slate-100' : 'border-slate-200 bg-white/95 text-[#0B2447]'
                                        }`}
                                    >
                                        <span className="text-[#19A7CE]">{t.ecosystemBadge}</span>
                                        <span className="opacity-50">·</span>
                                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.subSlogan}</span>
                                    </p>
                                    <h1 className={`mb-5 text-pretty text-4xl font-black tracking-tight md:text-5xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                        {isArabic ? (
                                            <>
                                                <span>{t.roleTitlePrimary}</span>
                                                <span className="mx-2 font-semibold text-[#19A7CE]">|</span>
                                                <span className="text-[#19A7CE]">{t.roleTitleAccent}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[#19A7CE]">{t.roleTitleAccent}</span>
                                                <span className="mx-2 font-semibold text-slate-400">|</span>
                                                <span>{t.roleTitlePrimary}</span>
                                            </>
                                        )}
                                    </h1>
                                    <p className={`mx-auto max-w-2xl text-pretty text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.roleDesc}</p>
                                    <p className={`mt-4 text-sm font-semibold ${isDark ? 'text-[#8ad9eb]' : 'text-[#0B2447]'}`}>{t.mainSlogan}</p>
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowIntro(true)}
                                            className={
                                                isDark
                                                    ? 'sr-btn-action-neutral inline-flex items-center gap-2 px-6 py-3 text-sm font-bold'
                                                    : 'sr-btn-action-neutral inline-flex items-center gap-2 px-6 py-3 text-sm font-bold'
                                            }
                                        >
                                            {t.aboutUs}
                                        </button>
                                        {auth.user && (
                                            <Link href={route('dashboard')} className="sr-btn-action-primary inline-flex px-8">
                                                {t.goDashboard}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {!auth.user && (
                                    <div id="join" className="relative z-10 mx-auto w-full max-w-6xl px-2">
                                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                            {roleCards.map((role) => {
                                                const Icon = role.Icon;
                                                return (
                                                    <div
                                                        key={role.id}
                                                        id={role.anchorId}
                                                        className={`flex scroll-mt-36 flex-col items-center rounded-3xl border px-8 pb-10 pt-10 text-center shadow-sm backdrop-blur transition md:pb-12 ${
                                                            isDark ? 'border-slate-700 bg-slate-900/80 shadow-lg' : 'border-gray-100 bg-white/92 sr-card-hover'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${role.iconWrap} text-white shadow-lg`}
                                                        >
                                                            <Icon className="h-8 w-8" strokeWidth={1.85} aria-hidden />
                                                        </div>
                                                        <h2 className={`mb-3 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{role.title}</h2>
                                                        <p className={`max-w-sm text-sm leading-relaxed md:text-base ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                            {role.desc}
                                                        </p>

                                                        <div className={`mt-8 flex flex-wrap items-center justify-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            {role.id === 'students' ? (
                                                                <Link
                                                                    href="/register"
                                                                    className={`inline-flex min-h-[3rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition hover:brightness-105 ${
                                                                        isDark
                                                                            ? 'border border-emerald-500/50 bg-emerald-950/50 text-emerald-100 hover:bg-emerald-900/50'
                                                                            : 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                                                    }`}
                                                                >
                                                                    {t.registerStudent}
                                                                </Link>
                                                            ) : null}
                                                            {role.id === 'supervisor' ? (
                                                                <Link
                                                                    href="/register?role=faculty"
                                                                    className={`inline-flex min-h-[3rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition hover:brightness-105 ${
                                                                        isDark
                                                                            ? 'border border-sky-500/50 bg-sky-950/40 text-sky-100 hover:bg-sky-900/40'
                                                                            : 'border border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100'
                                                                    }`}
                                                                >
                                                                    {t.registerFaculty}
                                                                </Link>
                                                            ) : null}
                                                            {role.id === 'industry' ? (
                                                                <Link
                                                                    href={route('register.industry')}
                                                                    className={`inline-flex min-h-[3rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition hover:brightness-105 ${
                                                                        isDark
                                                                            ? 'border border-violet-500/50 bg-violet-950/45 text-violet-100 hover:bg-violet-900/40'
                                                                            : 'border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100'
                                                                    }`}
                                                                >
                                                                    {t.registerCompany}
                                                                </Link>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-12 flex flex-col items-center gap-4 text-center">
                                            <Link
                                                href={route('login')}
                                                aria-label={isArabic ? 'تسجيل الدخول الموحد' : 'Unified sign in'}
                                                className={`inline-flex min-w-[14rem] items-center justify-center rounded-2xl px-10 py-4 text-lg font-black shadow-xl transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60 ${
                                                    isDark
                                                        ? 'bg-gradient-to-r from-emerald-500 to-[#19A7CE] text-emerald-950'
                                                        : 'bg-gradient-to-r from-[#0B2447] via-[#19A7CE] to-emerald-500 text-white'
                                                }`}
                                            >
                                                {t.joinUs}
                                            </Link>
                                            <p className={`mx-auto max-w-xl text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {t.joinUsHint}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                    <MarketingFooter isArabic={isArabic} isDark={isDark} />
                </div>
            </div>
        </>
    );
}
