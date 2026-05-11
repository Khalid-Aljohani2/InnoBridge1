import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { isArabic } = useUiPreferences();
    const t = isArabic
        ? {
              headTitle: 'تأكيد كلمة المرور',
              intro: 'هذه منطقة آمنة في النظام. يرجى تأكيد كلمة المرور قبل المتابعة.',
              password: 'كلمة المرور',
              confirm: 'تأكيد',
          }
        : {
              headTitle: 'Confirm Password',
              intro: 'This is a secure area of the application. Please confirm your password before continuing.',
              password: 'Password',
              confirm: 'Confirm',
          };
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t.headTitle} />

            <div className="mb-4 text-sm text-gray-600">
                {t.intro}
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t.password} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t.confirm}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
