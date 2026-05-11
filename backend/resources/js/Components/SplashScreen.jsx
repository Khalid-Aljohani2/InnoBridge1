import { useEffect, useMemo, useState } from 'react';

export const INNOBRIDGE_SPLASH_KEY = 'innobridge_splash_seen_v1';

const DURATION_MS = 3600;

/** 14 floating specks with deterministic pseudo-random layout (stable across renders). */
function ParticleField({ isDark }) {
    const particles = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => {
                const a = (i * 37) % 100;
                const b = (i * 53 + 11) % 100;
                const delay = (i * 0.32).toFixed(2);
                const size = 4 + (i % 4);
                return {
                    id: i,
                    left: `${a}%`,
                    top: `${b}%`,
                    delay: `${delay}s`,
                    size,
                    opacity: 0.35 + (i % 5) * 0.08,
                };
            }),
        [],
    );

    return (
        <>
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="pointer-events-none absolute rounded-full animate-floaty bg-gradient-to-br from-[#19A7CE] to-[#10B981] shadow-[0_0_12px_rgba(25,167,206,0.45)]"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        opacity: p.opacity,
                    }}
                />
            ))}
        </>
    );
}

export default function SplashScreen({ isArabic, isDark, onDone }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let raf = 0;

        const tick = (now) => {
            const elapsed = now - start;
            const p = Math.min(100, (elapsed / DURATION_MS) * 100);
            setProgress(p);
            if (elapsed < DURATION_MS) {
                raf = requestAnimationFrame(tick);
            } else {
                onDone?.();
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [onDone]);

    return (
        <div
            className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 ${
                isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            <div
                className={`pointer-events-none absolute inset-0 ${isDark ? 'opacity-50' : 'opacity-70'}`}
                aria-hidden
            >
                <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#19A7CE]/30 blur-[100px]" />
                <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-[#10B981]/25 blur-[90px]" />
                <div className="absolute left-1/4 bottom-1/3 h-56 w-56 rounded-full bg-[#0B2447]/30 blur-[80px]" />
            </div>

            <ParticleField isDark={isDark} />

            <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
                <div className="relative mb-8">
                    <div
                        className="absolute -inset-8 rounded-full bg-gradient-to-br from-[#19A7CE]/30 to-[#10B981]/20 blur-2xl"
                        aria-hidden
                    />
                    <svg
                        viewBox="0 0 240 140"
                        className="relative h-28 w-44 text-[#19A7CE] drop-shadow-[0_0_18px_rgba(25,167,206,0.45)] md:h-32 md:w-52"
                        aria-hidden
                    >
                        <defs>
                            <linearGradient id="bridgeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#0B2447" />
                                <stop offset="50%" stopColor="#19A7CE" />
                                <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                        </defs>
                        {/* Towers + deck: single stroke path for line-draw effect */}
                        <path
                            d="M 32 108 L 32 48 L 72 48 L 72 108 M 168 108 L 168 48 L 208 48 L 208 108 M 72 48 Q 120 12 168 48 M 72 68 Q 120 40 168 68 M 52 108 L 188 108"
                            fill="none"
                            stroke="url(#bridgeStroke)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength="1"
                            strokeDasharray="1"
                            strokeDashoffset={1 - progress / 100}
                            className="transition-[stroke-dashoffset] duration-75 ease-linear"
                        />
                    </svg>
                </div>

                <h1
                    className="bg-gradient-to-r from-[#0B2447] via-[#19A7CE] to-[#10B981] bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl"
                    style={{ WebkitBackgroundClip: 'text' }}
                >
                    {isArabic ? 'جسر الابتكار' : 'InnoBridge'}
                </h1>
                <p className="mt-2 text-sm font-semibold text-[#0B2447] dark:text-[#8ad9eb] md:text-base">
                    {isArabic ? 'InnoBridge' : 'Innovation Bridge'}
                </p>
                <p className={`mt-4 max-w-md text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isArabic ? 'بوابتكم لتحويل تحديات الأعمال إلى أصول ابتكارية.' : 'Your gateway from business challenges to innovation assets.'}
                </p>
                <p className={`mt-2 max-w-lg text-xs font-medium leading-relaxed opacity-90 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isArabic
                        ? 'حيث تجد الشركات حلولها، ويصنع الطلاب مستقبلهم.'
                        : 'Where companies find solutions—and students build their future.'}
                </p>

                <div className="mt-10 w-full max-w-xs">
                    <div
                        className={`relative h-2.5 overflow-hidden rounded-full ${
                            isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                    >
                        <div
                            className="relative h-full rounded-full bg-gradient-to-r from-[#19A7CE] via-[#10B981] to-[#0B2447] shadow-[0_0_20px_rgba(25,167,206,0.5)] transition-[width] duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70 mix-blend-overlay"
                            style={{ backgroundSize: '200% 100%' }}
                        />
                    </div>
                    <p className={`mt-3 text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {isArabic ? 'جاري تهيئة التجربة…' : 'Preparing your experience…'}
                    </p>
                </div>
            </div>
        </div>
    );
}
