export default function AuroraBackground({ isDark }) {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div
                className={`absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full blur-3xl animate-aurora opacity-70 ${
                    isDark ? 'bg-[#19A7CE]/25' : 'bg-[#19A7CE]/30'
                }`}
            />
            <div
                className={`absolute -right-1/4 bottom-0 h-[480px] w-[480px] rounded-full blur-3xl animate-aurora opacity-60 [animation-delay:3s] ${
                    isDark ? 'bg-[#10B981]/20' : 'bg-[#10B981]/25'
                }`}
            />
            <div
                className={`absolute left-1/3 top-1/3 h-[320px] w-[320px] rounded-full blur-3xl animate-aurora opacity-50 [animation-delay:6s] ${
                    isDark ? 'bg-[#0B2447]/40' : 'bg-[#0B2447]/15'
                }`}
            />
        </div>
    );
}
