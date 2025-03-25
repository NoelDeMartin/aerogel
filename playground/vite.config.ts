import { URL, fileURLToPath } from 'node:url';

import Aerogel, { AerogelResolver } from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { defineConfig } from 'vitest/config';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/playground/' : undefined;

export default defineConfig({
    base: basePath,
    publicDir: fileURLToPath(new URL('./src/assets/public/', import.meta.url)),
    plugins: [
        Aerogel({
            name: 'Aerogel Playground',
            description: 'Explore this playground to see what Aerogel can do',
            baseUrl: 'https://aerogel.js.org/playground/',
            icons: {
                '192x192': 'android-chrome-192x192.png',
                '512x512': 'android-chrome-512x512.png',
            },
        }),
        Components({
            dirs: ['src/pages', 'src/components'],
            dts: false,
            resolvers: [AerogelResolver(), IconsResolver()],
        }),
        I18n({ include: fileURLToPath(new URL('./src/lang/**/*.yaml', import.meta.url)) }),
        Icons({
            iconCustomizer(_, __, props) {
                props['aria-hidden'] = 'true';
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src/', import.meta.url)),
            '@aerogel/core': fileURLToPath(new URL('../packages/core/src/', import.meta.url)),
            '@aerogel/cypress': fileURLToPath(new URL('../packages/cypress/src/', import.meta.url)),
            '@aerogel/plugin-i18n': fileURLToPath(new URL('../packages/plugin-i18n/src/', import.meta.url)),
            '@aerogel/plugin-offline-first': fileURLToPath(
                new URL('../packages/plugin-offline-first/src/', import.meta.url),
            ),
            '@aerogel/plugin-routing': fileURLToPath(new URL('../packages/plugin-routing/src/', import.meta.url)),
            '@aerogel/plugin-solid': fileURLToPath(new URL('../packages/plugin-solid/src/', import.meta.url)),
            '@aerogel/plugin-soukai': fileURLToPath(new URL('../packages/plugin-soukai/src/', import.meta.url)),
        },
    },
});
