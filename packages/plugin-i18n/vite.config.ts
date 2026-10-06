import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-plugin-i18n',
        },
        rollupOptions: {
            external: ['@aerogel/core', '@noeldemartin/utils', 'virtual:aerogel-messages', 'vue-i18n'],
        },
    },
    plugins: lazyPlugins(() => [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
        }),
        Aerogel({ lib: true }),
        I18n({ include: fileURLToPath(new URL('./src/testing/stubs/lang/**/*.yaml', import.meta.url)) }),
    ]),
    resolve: {
        alias: {
            '@aerogel/plugin-i18n': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
