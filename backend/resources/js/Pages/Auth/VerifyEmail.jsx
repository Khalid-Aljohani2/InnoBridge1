import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { isArabic } = useUiPreferences();
    const t = isArabic
        ? {
              headTitle: 'تأكيد البريد الإلكتروني',
              intro: 'شكرًا لتسجيلك! قبل البدء، يرجى تأكيد بريدك الإلكتروني من خلال الرابط الذي أرسلناه لك. إذا لم تستلم الرسالة، يمكننا إرسال واحدة جديدة.',
              sent: 'تم إرسال رابط تأكيد جديد إلى البريد الإلكتروني الذي أدخلته أثناء التسجيل.',
              resend: 'إعادة إرسال رسالة التأكيد',
              logout: 'تسجيل الخروج',
          }
        : {
              headTitle: 'Email Verification',
              intro: "Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.",
              sent: 'A new verification link has been sent to the email address you provided during registration.',
              resend: 'Resend Verification Email',
              logout: 'Log Out',
          };
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t.headTitle} />

            <div className="mb-4 text-sm text-gray-600">
                {t.intro}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {t.sent}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {t.resend}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t.logout}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
