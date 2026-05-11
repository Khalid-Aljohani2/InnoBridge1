<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Mirrors resources/js/stores/uiPreferencesStore.js readInitialTheme() to avoid FOUC before Vite bundles. --}}
        <script>
            (function () {
                try {
                    var saved = localStorage.getItem('srnd_theme');
                    var root = document.documentElement;
                    if (saved === 'dark') {
                        root.classList.add('dark');
                        return;
                    }
                    if (saved === 'light') {
                        root.classList.remove('dark');
                        return;
                    }
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        root.classList.add('dark');
                    }
                } catch (e) {}
            })();
        </script>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
