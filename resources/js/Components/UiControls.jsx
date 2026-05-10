/**
 * Theme + language toggles. Inline SVGs avoid bundler resolution issues when CI skips optional deps.
 */
function IconGlobe({ className }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
        </svg>
    );
}

function IconMoon({ className }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

function IconSun({ className }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

export default function UiControls({
    isDark,
    isArabic,
    toggleLanguage,
    toggleTheme,
    compact = false,
    iconsOnly = true,
}) {
    const pad = compact ? 'p-0.5' : 'p-1';
    const btn = `relative flex shrink-0 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19A7CE]/50 ${
        compact ? 'h-8 w-8' : 'h-9 w-9'
    }`;

    const langAria = isArabic ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic';
    const themeAria = isDark
        ? isArabic ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode'
        : isArabic ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode';

    if (iconsOnly) {
        return (
            <div
                role="toolbar"
                aria-label={isArabic ? 'اللغة والمظهر' : 'Language and theme'}
                className={`inline-flex shrink-0 items-center gap-px rounded-xl border shadow-sm backdrop-blur-sm ${pad} ${
                    isDark ? 'border-slate-600 bg-slate-900/95' : 'border-slate-200 bg-white/95'
                }`}
            >
                <button
                    type="button"
                    onClick={toggleLanguage}
                    className={`${btn} ${
                        isArabic
                            ? 'text-[#19A7CE] hover:bg-[#19A7CE]/15'
                            : isDark
                              ? 'text-slate-200 hover:bg-slate-800'
                              : 'text-[#0B2447] hover:bg-slate-100'
                    }`}
                    title={langAria}
                    aria-label={langAria}
                >
                    <IconGlobe className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
                </button>
                <button
                    type="button"
                    onClick={toggleTheme}
                    className={`${btn} ${
                        isDark ? 'text-amber-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title={themeAria}
                    aria-label={themeAria}
                >
                    {isDark ? (
                        <IconSun className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
                    ) : (
                        <IconMoon className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
                    )}
                </button>
            </div>
        );
    }

    return (
        <div
            className={`inline-flex items-center rounded-xl border p-1 ${isDark ? 'bg-slate-800/90 border-slate-700 shadow-sm' : 'bg-white/90 border-slate-200 shadow-sm'} ${compact ? 'gap-1' : 'gap-2'}`}
        >
            <button
                type="button"
                onClick={toggleLanguage}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isArabic ? 'bg-blue-600 text-white hover:bg-blue-700' : isDark ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={langAria}
            >
                <IconGlobe className="h-4 w-4" />
                <span>{isArabic ? 'EN' : 'عربي'}</span>
            </button>
            <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
                title={themeAria}
            >
                {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
        </div>
    );
}
