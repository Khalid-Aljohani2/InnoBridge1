export default function ProgressBar({ value, isDark, max = 100, toneClassName }) {
    const pct = Math.min(100, Math.max(0, (Number(value) / max) * 100));
    const fill =
        toneClassName ??
        'bg-gradient-to-r from-[#19A7CE] via-[#10B981] to-[#0B2447]';

    return (
        <div className={`h-2.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all duration-500 ease-out ${fill}`} style={{ width: `${pct}%` }} />
        </div>
    );
}
