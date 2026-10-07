import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
    plugins: [
        Aerogel({
            name: 'Aerogel Storybook',
            description: 'Aerogel Component Storybook',
        }),
    ],
    resolve: {
        alias: {
            '@aerogel/core': fileURLToPath(new URL('../packages/core/src/', import.meta.url)),
            '@aerogel/plugin-i18n': fileURLToPath(new URL('../packages/plugin-i18n/src/', import.meta.url)),
            '@aerogel/plugin-local-first': fileURLToPath(
                new URL('../packages/plugin-local-first/src/', import.meta.url),
            ),
            '@aerogel/plugin-routing': fileURLToPath(new URL('../packages/plugin-routing/src/', import.meta.url)),
            '@aerogel/plugin-solid': fileURLToPath(new URL('../packages/plugin-solid/src/', import.meta.url)),
            '@aerogel/storybook': fileURLToPath(new URL('../packages/storybook/src/', import.meta.url)),
        },
    },
});
