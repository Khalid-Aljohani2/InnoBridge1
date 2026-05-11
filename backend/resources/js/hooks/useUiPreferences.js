import { subscribe, getSnapshot, getServerSnapshot, setUiLanguage, setUiTheme } from '@/stores/uiPreferencesStore';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

const PREFERENCES_SYNC_DEBOUNCE_MS = 450;

export default function useUiPreferences() {
    const { lang, theme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const page = usePage();
    const authUser = page?.props?.auth?.user;
    const syncTimerRef = useRef(null);

    useEffect(
        () => () => {
            if (syncTimerRef.current !== null) {
                clearTimeout(syncTimerRef.current);
            }
        },
        [],
    );

    useEffect(() => {
        if (!authUser) return;
        if (authUser.preferred_language === 'ar' || authUser.preferred_language === 'en') {
            setUiLanguage(authUser.preferred_language);
        }
        if (authUser.preferred_theme === 'light' || authUser.preferred_theme === 'dark') {
            setUiTheme(authUser.preferred_theme);
        }
    }, [authUser?.id, authUser?.preferred_language, authUser?.preferred_theme]);

    const syncToServer = useCallback(
        (nextLang, nextTheme) => {
            if (typeof window === 'undefined' || !authUser) return;

            if (syncTimerRef.current !== null) {
                clearTimeout(syncTimerRef.current);
            }
            syncTimerRef.current = window.setTimeout(async () => {
                syncTimerRef.current = null;
                try {
                    await window.axios.patch(route('preferences.update'), {
                        language: nextLang,
                        theme: nextTheme,
                    });
                } catch {
                    // Keep local preference even if server sync fails.
                }
            }, PREFERENCES_SYNC_DEBOUNCE_MS);
        },
        [authUser],
    );

    const toggleLanguage = useCallback(() => {
        const next = lang === 'ar' ? 'en' : 'ar';
        setUiLanguage(next);
        syncToServer(next, theme);
    }, [lang, theme, syncToServer]);

    const toggleTheme = useCallback(() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setUiTheme(next);
        syncToServer(lang, next);
    }, [lang, theme, syncToServer]);

    return useMemo(
        () => ({
            lang,
            theme,
            isArabic: lang === 'ar',
            isDark: theme === 'dark',
            toggleLanguage,
            toggleTheme,
        }),
        [lang, theme, toggleLanguage, toggleTheme],
    );
}
