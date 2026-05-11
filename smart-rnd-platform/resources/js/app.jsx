import '../css/app.css';
import './bootstrap';
import './stores/uiPreferencesStore';
import i18n from './i18n';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

const appName = import.meta.env.VITE_APP_NAME || 'InnoBridge';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <I18nextProvider i18n={i18n}>
                <App {...props} />
            </I18nextProvider>,
        );
    },
    // شريط التقدم العلوي يظهر خلال زيارة Inertia إلى الخادم؛ delay يخفّف الوميض في التنقّلات السريعة فقط.
    progress: {
        color: '#19A7CE',
        delay: 250,
        showSpinner: false,
    },
});
