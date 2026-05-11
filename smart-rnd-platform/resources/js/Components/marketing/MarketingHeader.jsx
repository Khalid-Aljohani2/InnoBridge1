import UiControls from '@/Components/UiControls';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Link } from '@inertiajs/react';
import { Briefcase, Lightbulb, Link2 } from 'lucide-react';

/**
 * Unified marketing header — RTL-aware. Brand text replaces standalone logo artwork.
 */
export default function MarketingHeader({ trailing, variant = 'default' }) {
    const { isArabic, isDark, toggleLanguage, toggleTheme } = useUiPreferences();

    const t = isArabic
        ? {
              brandPrimary: 'جسر الابتكار',
              brandSecondary: 'InnoBridge',
              navIndustry: 'تحديات الشركات',
              navInnovators: 'حلول المبتكرين',
              navAbout: 'عن المنصة',
          }
        : {
              brandPrimary: 'InnoBridge',
              brandSecondary: 'Innovation Bridge',
              navIndustry: 'Company challenges',
              navInnovators: 'Innovator solutions',
              navAbout: 'About the platform',
          };

    const linkBase = `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19A7CE]/50 ${
        isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-[#0B2447] hover:bg-[#19A7CE]/10 hover:text-[#0B2447]'
    }`;

    const compact = variant === 'compact';

    return (
        <header
            className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl ${
                isDark ? 'border-slate-700/80 bg-slate-950/85' : 'border-slate-200/90 bg-white/85'
            }`}
        >
            <div
                className={`mx-auto flex w-full max-w-7xl flex-col gap-y-4 px-4 ${compact ? 'py-2.5' : 'py-4'} sm:flex-row sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-3`}
            >
                <Link
                    href="/"
                    className="group ms-1 min-w-0 max-w-[min(100%,32rem)] shrink-0 self-start text-start transition sm:self-center"
                >
                    <span
                        className={`font-black tracking-tight ${compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'} ${
                            isDark ? 'text-slate-100' : 'text-[#0B2447]'
                        }`}
                    >
                        {isArabic ? (
                            <>
                                {t.brandPrimary}
                                <span className="mx-1.5 font-semibold text-[#19A7CE]">|</span>
                                <span className="text-[#19A7CE]">{t.brandSecondary}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-[#19A7CE]">{t.brandPrimary}</span>
                                <span className="mx-1.5 font-semibold text-slate-400">|</span>
                                {t.brandSecondary}
                            </>
                        )}
                    </span>
                </Link>

                <nav
                    className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 gap-y-2 md:justify-center lg:gap-2"
                    aria-label={isArabic ? 'التنقل الرئيسي' : 'Primary navigation'}
                >
                    <a href="/#industry" className={linkBase}>
                        <Briefcase className="h-4 w-4 shrink-0 text-[#10B981]" aria-hidden />
                        {t.navIndustry}
                    </a>
                    <a href="/#students" className={linkBase}>
                        <Lightbulb className="h-4 w-4 shrink-0 text-[#19A7CE]" aria-hidden />
                        {t.navInnovators}
                    </a>
                    <a href="/?about=1" className={linkBase}>
                        <Link2 className="h-4 w-4 shrink-0 text-[#0B2447] dark:text-[#8ad9eb]" aria-hidden />
                        {t.navAbout}
                    </a>
                </nav>

                <div className="flex shrink-0 items-center justify-end gap-2 self-end ms-auto sm:self-center md:gap-3" dir="ltr">
                    <UiControls
                        isDark={isDark}
                        isArabic={isArabic}
                        toggleLanguage={toggleLanguage}
                        toggleTheme={toggleTheme}
                        compact={compact}
                        iconsOnly
                    />
                    {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
                </div>
            </div>
        </header>
    );
}
