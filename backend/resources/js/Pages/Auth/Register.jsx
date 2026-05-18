import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm } from '@inertiajs/react';

function registrationKindFromPreset(preset) {
    if (preset === 'faculty') {
        return 'faculty';
    }
    if (preset === 'industry') {
        return 'industry';
    }
    return 'student';
}

export default function Register({ registrationPreset = 'student' }) {
    const { isArabic, isDark } = useUiPreferences();
    const isFaculty = registrationPreset === 'faculty';
    const isIndustry = registrationPreset === 'industry';

    const loginHref =
        registrationPreset === 'industry'
            ? route('login', { role: 'industry' })
            : registrationPreset === 'student'
                ? route('login', { role: 'student' })
                : route('login');

    const t = isArabic
        ? {
            headTitle: isFaculty
                ? 'إنشاء حساب أكاديمي'
                : isIndustry
                    ? 'إنشاء حساب جهة صناعية'
                    : 'إنشاء حساب طالب',
            title: 'إنشاء حساب',
            subtitle: isFaculty
                ? 'أكمل بياناتك وحدّد دورك ضمن المنصة.'
                : isIndustry
                    ? 'تمثّل جهتك لنشر التحديات ومتابعة الطلاب والمشرفين. تأكد أنك تبدأ من بطاقة «جهة الصناعة» في الصفحة الرئيسية.'
                    : 'انضم إلى InnoBridge كطالب: فريقك، مساحة العمل، وربطك بمشرفك. ابدأ من بطاقة «الطلاب» في الصفحة الرئيسية.',
            industryNote:
                'بعد التسجيل ستصل إلى بوابة جهة الصناعة لإدارة التحديات والتعاون مع الأكاديميين.',
            facultyHint:
                'يمكن تنشيط حساب واحد بدور واحد الآن؛ إن كان لك أكثر من دور رسمي اتصل بالإدارة لربط الصلاحيات.',
            facultySection: 'صفة حساب الأكاديمي',
            roleHod: 'مشرف قسم (رئيس القسم)',
            roleHodDesc: 'لوحة الموافقة على الفِرَق، المراجعة، وتعيين المشرفين ضمن القسم.',
            roleSupervisor: 'مشرف مشاريع تخرج',
            roleSupervisorDesc: 'مجموعات الإشراف، المراحل، التقييم والتسليمات مع الطلاب.',
            name: 'الاسم',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            confirmPassword: 'تأكيد كلمة المرور',
            alreadyRegistered: 'لديك حساب بالفعل؟',
            register: 'إنشاء الحساب',
        }
        : {
            headTitle: isFaculty ? 'Faculty registration' : isIndustry ? 'Industry partner signup' : 'Student registration',
            title: 'Create account',
            subtitle: isFaculty
                ? 'Complete your details and specify how you engage with InnoBridge.'
                : isIndustry
                    ? 'Register your organization to publish challenges and collaborate with academic teams. Start from the Industry card on the home page.'
                    : 'Join InnoBridge as a student — teams, workspace, and supervisor alignment. Start from the Students card on the home page.',
            industryNote: 'After signup you will land in the industry portal to manage challenges.',
            facultyHint:
                'Accounts are provisioned under a single primary role today; contact your coordinator if that does not reflect your mandate.',
            facultySection: 'Academic role',
            roleHod: 'Head of Department',
            roleHodDesc: 'Team approvals, reviews, and supervisor assignment within your department.',
            roleSupervisor: 'Graduation-project supervisor',
            roleSupervisorDesc: 'Student groups you supervise — milestones, feedback, submissions.',
            name: 'Name',
            email: 'Email address',
            password: 'Password',
            confirmPassword: 'Confirm password',
            alreadyRegistered: 'Already registered?',
            register: 'Register',
        };

    const kind = registrationKindFromPreset(registrationPreset);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        registration_kind: kind,
        faculty_role: 'supervisor',
    });

    transform((payload) => ({
        ...payload,
        registration_kind: registrationKindFromPreset(registrationPreset),
    }));

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const outlineWhen = (active) =>
        active
            ? isDark
                ? 'border-emerald-500 bg-emerald-950/35 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]'
                : 'border-emerald-600 bg-emerald-50 shadow-[inset_0_0_0_1px_rgba(5,150,105,0.22)]'
            : isDark
                ? 'border-slate-600 bg-slate-800/45 hover:border-slate-500'
                : 'border-slate-200 bg-white hover:border-slate-300';

    return (
        <GuestLayout>
            <Head title={t.headTitle} />

            <div className="mb-5">
                <h1 className="sr-section-title text-slate-900 dark:text-slate-100">{t.title}</h1>
                <p className="sr-muted mt-1">{t.subtitle}</p>
                {isIndustry ? (
                    <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold leading-relaxed ${isDark
                                ? 'border-violet-500/40 bg-violet-950/45 text-violet-100'
                                : 'border-violet-200 bg-violet-50 text-violet-900'
                            }`}
                    >
                        {t.industryNote}
                    </p>
                ) : null}
                {isFaculty ? null : isIndustry ? null : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {isArabic
                            ? 'للمشرفين ورؤساء الأقسام استخدم بطاقة «الأكاالا»، ولجهات الصناعة بطاقة «جهة الصناعة».'
                            : 'Faculty should use the Faculty card; industry partners should use the Industry card.'}
                    </p>
                )}
            </div>

            <form key={registrationPreset} onSubmit={submit} className="sr-section-stack">
                <div>
                    <InputLabel htmlFor="name" value={t.name} />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value={t.email} />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                {isFaculty && (
                    <fieldset className="mt-5 space-y-3">
                        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.facultySection}</legend>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t.facultyHint}</p>

                        <label
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition focus-within:ring-2 focus-within:ring-emerald-500/70 ${outlineWhen(
                                data.faculty_role === 'supervisor',
                            )}`}
                        >
                            <Checkbox
                                name="faculty_role_supervisor"
                                checked={data.faculty_role === 'supervisor'}
                                onChange={() => setData('faculty_role', 'supervisor')}
                                className="mt-1 shrink-0 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 dark:border-slate-500"
                            />
                            <span className="min-w-0 flex-1 text-start">
                                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{t.roleSupervisor}</span>
                                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{t.roleSupervisorDesc}</span>
                            </span>
                        </label>

                        <label
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition focus-within:ring-2 focus-within:ring-emerald-500/70 ${outlineWhen(
                                data.faculty_role === 'hod',
                            )}`}
                        >
                            <Checkbox
                                name="faculty_role_hod"
                                checked={data.faculty_role === 'hod'}
                                onChange={() => setData('faculty_role', 'hod')}
                                className="mt-1 shrink-0 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 dark:border-slate-500"
                            />
                            <span className="min-w-0 flex-1 text-start">
                                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{t.roleHod}</span>
                                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{t.roleHodDesc}</span>
                            </span>
                        </label>

                        <InputError message={errors.faculty_role} className="mt-1" />
                        <InputError message={errors.registration_kind} className="mt-1" />
                    </fieldset>
                )}

                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t.password} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value={t.confirmPassword} />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                    <Link
                        href={loginHref}
                        className={`rounded-md text-sm underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        {t.alreadyRegistered}
                    </Link>

                    <PrimaryButton className="!ms-0 sr-btn-action-primary w-auto px-5" disabled={processing}>
                        {t.register}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
