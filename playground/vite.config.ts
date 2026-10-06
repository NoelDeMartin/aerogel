import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import { defineConfig } from 'vite-plus';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/playground/' : undefined;

export default defineConfig({
    base: basePath,
    plugins: [
        Aerogel({
            name: 'Aerogel Playground',
            description: 'Explore this playground to see what Aerogel can do',
            baseUrl: 'https://aerogel.js.org/playground/',
        }),
    ],
    resolve: {
        alias: {
            '@aerogel/core': fileURLToPath(new URL('../packages/core/src/', import.meta.url)),
            '@aerogel/playground': fileURLToPath(new URL('../packages/playground/src/', import.meta.url)),
            '@aerogel/plugin-i18n': fileURLToPath(new URL('../packages/plugin-i18n/src/', import.meta.url)),
            '@aerogel/plugin-local-first': fileURLToPath(
                new URL('../packages/plugin-local-first/src/', import.meta.url),
            ),
            '@aerogel/plugin-routing': fileURLToPath(new URL('../packages/plugin-routing/src/', import.meta.url)),
            '@aerogel/plugin-solid': fileURLToPath(new URL('../packages/plugin-solid/src/', import.meta.url)),
        },
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
