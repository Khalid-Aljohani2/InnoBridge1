/**
 * Stub module — Vite resolves `lucide-react` here so CI/Vercel never needs the npm package.
 * Icons match the lucide-react API (function components, className, strokeWidth, aria-hidden).
 */
function makeIcon(paths) {
    return function Icon({ className, strokeWidth = 2, ...props }) {
        return (
            <svg
                className={className}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                {...props}
            >
                {paths}
            </svg>
        );
    };
}

export const Globe = makeIcon(
    <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
    </>
);

export const Moon = makeIcon(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />);

export const Sun = makeIcon(
    <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
);
