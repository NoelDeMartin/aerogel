import Aerogel, { AerogelResolver } from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/playground/' : undefined;

export default defineConfig({
    base: basePath,
    publicDir: resolve(__dirname, './src/assets/public/'),
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
        I18n({ include: resolve(__dirname, './src/lang/**/*.yaml') }),
        Icons({
            iconCustomizer(_, __, props) {
                props['aria-hidden'] = 'true';
            },
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
