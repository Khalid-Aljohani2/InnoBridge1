/**
 * Keep PostCSS scoped to this SPA so Vite does not pick up the monorepo root
 * `postcss.config.js` (Tailwind for Laravel/Inertia), which lacks ./src paths here
 * and triggers empty `content` warnings.
 */
export default {
    plugins: {},
};
