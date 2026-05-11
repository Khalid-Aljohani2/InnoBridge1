import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { isArabic } = useUiPreferences();
    const t = isArabic
        ? {
              headTitle: 'إعادة تعيين كلمة المرور',
              email: 'البريد الإلكتروني',
              password: 'كلمة المرور',
              confirmPassword: 'تأكيد كلمة المرور',
              submit: 'إعادة تعيين كلمة المرور',
          }
        : {
              headTitle: 'Reset Password',
              email: 'Email address',
              password: 'Password',
              confirmPassword: 'Confirm Password',
              submit: 'Reset Password',
          };
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t.headTitle} />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value={t.email} />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t.password} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value={t.confirmPassword}
                    />

                    <TextInput
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t.submit}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
