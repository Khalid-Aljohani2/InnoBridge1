import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

i18n.use(initReactI18next).init({
    lng: readInitialLanguage(),
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    interpolation: { escapeValue: false },
    resources: {
        ar: { translation: {} },
        en: { translation: {} },
    },
    react: { useSuspense: false },
});

export default i18n;
