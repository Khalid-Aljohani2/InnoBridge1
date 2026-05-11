/**
 * Unified metric tile — InnoBridge palette, Lucide-friendly (stroke 1.75).
 * Works with react-icons too; extra props are ignored by most icon sets.
 */

const toneStyles = {
    navy: {
        box: 'border-[#19A7CE]/22 bg-[#0B2447]/[0.055] dark:border-[#19A7CE]/28 dark:bg-[#0B2447]/35',
        icon: 'text-[#0B2447] dark:text-[#89d7ea]',
    },
    blue: {
        box: 'border-[#19A7CE]/32 bg-[#19A7CE]/[0.09] dark:border-[#19A7CE]/38 dark:bg-[#19A7CE]/14',
        icon: 'text-[#127a8f] dark:text-[#5ecce8]',
    },
    emerald: {
        box: 'border-emerald-500/22 bg-emerald-500/[0.07] dark:border-emerald-400/25 dark:bg-emerald-500/12',
        icon: 'text-emerald-700 dark:text-emerald-300',
    },
    amber: {
        box: 'border-amber-500/25 bg-amber-500/[0.08] dark:border-amber-400/28 dark:bg-amber-500/12',
        icon: 'text-amber-800 dark:text-amber-200',
    },
    red: {
        box: 'border-rose-500/22 bg-rose-500/[0.07] dark:border-rose-400/28 dark:bg-rose-500/12',
        icon: 'text-rose-700 dark:text-rose-300',
    },
    violet: {
        box: 'border-violet-500/22 bg-violet-500/[0.07] dark:border-violet-400/28 dark:bg-violet-500/12',
        icon: 'text-violet-700 dark:text-violet-300',
    },
};

export default function StatCard({ icon: Icon, label, value, tone = 'blue', isDark, className = '', compact = false }) {
    const palette = toneStyles[tone] ?? toneStyles.blue;
    const iconWrap = compact ? 'h-9 w-9 rounded-lg' : 'h-11 w-11 rounded-xl';
    const iconSize = compact ? 'h-4 w-4' : 'h-5 w-5';
    const valueText = compact ? 'text-xl' : 'text-2xl';
    const padding = compact ? 'p-3' : 'p-4';

    return (
        <div
            className={`rounded-2xl border shadow-sm transition duration-200 hover:shadow-md hover:border-[#19A7CE]/25 ${
                isDark ? 'border-slate-700/90 bg-slate-900/75' : 'border-slate-200/90 bg-white'
            } ${padding} ${className}`}
        >
            <div className="flex items-start gap-3">
                {Icon ? (
                    <div
                        className={`flex shrink-0 items-center justify-center border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ${iconWrap} ${palette.box}`}
                        aria-hidden
                    >
                        <Icon className={`${iconSize} ${palette.icon}`} strokeWidth={1.75} />
                    </div>
                ) : null}
                <div className="min-w-0 flex-1 pt-0.5">
                    <p
                        className={`text-[10px] font-bold uppercase leading-snug tracking-wide ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                    >
                        {label}
                    </p>
                    <p
                        className={`${valueText} mt-1 font-black tabular-nums leading-tight tracking-tight ${
                            isDark ? 'text-slate-50' : 'text-slate-900'
                        }`}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
