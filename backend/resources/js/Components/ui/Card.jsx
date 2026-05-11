export default function Card({ children, isDark, className = '', paddingClass = 'p-6' }) {
    return (
        <div
            className={`rounded-2xl border shadow-sm ${paddingClass} ${
                isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200/80 bg-white/95'
            } ${className}`}
        >
            {children}
        </div>
    );
}
