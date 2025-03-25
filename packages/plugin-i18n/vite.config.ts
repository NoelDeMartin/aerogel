import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import Icons from 'unplugin-icons/vite';
import dts from 'vite-plugin-dts';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-plugin-i18n',
        },
        rollupOptions: {
            external: ['@aerogel/core', '@noeldemartin/utils', 'vue-i18n'],
        },
    },
    plugins: [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
        }),
        Aerogel({ lib: true }),
        Icons(),
        I18n({ include: fileURLToPath(new URL('./src/testing/stubs/lang/**/*.yaml', import.meta.url)) }),
    ],
    resolve: {
        alias: {
            '@aerogel/plugin-i18n': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
