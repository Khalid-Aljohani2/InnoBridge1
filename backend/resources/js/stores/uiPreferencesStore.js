import i18n from '../i18n';

function readInitialLanguage() {
    if (typeof window === 'undefined') {
        return 'ar';
    }
    const saved = window.localStorage.getItem('srnd_lang');
    if (saved === 'ar' || saved === 'en') {
        return saved;
    }
    const browserLang = (window.navigator.language || '').toLowerCase();
    const inferred = browserLang.startsWith('ar') ? 'ar' : 'en';
    window.localStorage.setItem('srnd_lang', inferred);
    return inferred;
}

function readInitialTheme() {
    if (typeof window === 'undefined') {
        return 'light';
    }
    const saved = window.localStorage.getItem('srnd_theme');
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const inferred = prefersDark ? 'dark' : 'light';
    window.localStorage.setItem('srnd_theme', inferred);
    return inferred;
}

let state = {
    lang: readInitialLanguage(),
    theme: readInitialTheme(),
};

function syncDomTheme(theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
}

syncDomTheme(state.theme);

const listeners = new Set();

function emit() {
    listeners.forEach((fn) => fn());
}

export function getSnapshot() {
    return state;
}

/** Same shape as getSnapshot for SSR / hydration (Inertia is mostly client-rendered). */
export function getServerSnapshot() {
    return { lang: 'ar', theme: 'light' };
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setUiLanguage(next) {
    if (next !== 'ar' && next !== 'en') return;
    if (state.lang === next) {
        return;
    }
    state = { ...state, lang: next };
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('srnd_lang', next);
    }
    void i18n.changeLanguage(next);
    emit();
}

export function setUiTheme(next) {
    if (next !== 'light' && next !== 'dark') return;
    if (state.theme === next) {
        return;
    }
    state = { ...state, theme: next };
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('srnd_theme', next);
    }
    syncDomTheme(next);
    emit();
}
