import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import { externalDependencies } from '@noeldemartin/vite-plus-config';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-plugin-i18n',
        },
        rollupOptions: {
            external: externalDependencies(packageJson, { include: [/^virtual:/] }),
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
