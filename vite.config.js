import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            // Never rely on node_modules on Vercel — old commits may still `import from 'lucide-react'`.
            'lucide-react': path.resolve(__dirname, 'resources/js/shims/lucide-react.jsx'),
        },
    },
});
