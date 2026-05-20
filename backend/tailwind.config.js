import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                ib: {
                    navy: {
                        light: '#f3f4f6',
                        dark: '#0B2447',
                    },
                    cyan: {
                        light: '#0284c7',
                        dark: '#19A7CE',
                    },
                    mint: '#10B981',
                },
            },
            keyframes: {
                aurora: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '50%': { transform: 'translate(8%, -6%) scale(1.06)' },
                },
                floaty: {
                    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
                    '50%': { transform: 'translateY(-14px) translateX(6px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
            },
            animation: {
                aurora: 'aurora 18s ease-in-out infinite',
                floaty: 'floaty 5.5s ease-in-out infinite',
                shimmer: 'shimmer 2.4s linear infinite',
            },
        },
    },

    plugins: [forms],
};
