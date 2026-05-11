import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { isArabic } = useUiPreferences();
    const t = isArabic
        ? {
              headTitle: 'نسيت كلمة المرور',
              intro: 'نسيت كلمة المرور؟ لا مشكلة. أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.',
              resetLink: 'إرسال رابط إعادة تعيين كلمة المرور',
          }
        : {
              headTitle: 'Forgot Password',
              intro: 'Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.',
              resetLink: 'Email Password Reset Link',
          };
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title={t.headTitle} />

            <div className="mb-4 text-sm text-gray-600">
                {t.intro}
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t.resetLink}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
