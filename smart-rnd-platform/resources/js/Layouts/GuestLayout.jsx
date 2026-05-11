import MarketingFooter from '@/Components/marketing/MarketingFooter';
import MarketingHeader from '@/Components/marketing/MarketingHeader';
import useUiPreferences from '@/hooks/useUiPreferences';
export default function GuestLayout({ children }) {
    const { isArabic, isDark } = useUiPreferences();

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`flex min-h-screen flex-col transition-colors ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}
        >
            <MarketingHeader variant="compact" />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
                    <div className="mb-6 flex w-full max-w-md flex-wrap items-center justify-end gap-2 sm:max-w-lg">
                        <button
                            type="button"
                            onClick={() => {
                                if (window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    window.location.href = '/';
                                }
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                                isDark
                                    ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span aria-hidden>{isArabic ? '→' : '←'}</span>
                            <span>{isArabic ? 'عودة' : 'Back'}</span>
                        </button>
                    </div>

                    <p
                        className={`mb-6 max-w-md text-center text-xs font-semibold tracking-wide md:text-sm ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                    >
                        {isArabic ? 'بوابة الدخول — جسر الابتكار | InnoBridge' : 'Sign in — InnoBridge | Innovation Bridge'}
                    </p>

                    <div
                        className={`w-full max-w-md overflow-hidden rounded-2xl border px-6 py-5 shadow-xl ${
                            isDark ? 'border-slate-700 bg-slate-900/95' : 'border-slate-200 bg-white/95'
                        }`}
                    >
                        {children}
                    </div>
                </div>

                <MarketingFooter isArabic={isArabic} isDark={isDark} />
            </div>
        </div>
    );
}
