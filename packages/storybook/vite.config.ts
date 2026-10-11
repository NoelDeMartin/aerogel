import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: { index: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
            formats: ['es'],
        },
        rollupOptions: {
            external: ['@aerogel/core', '@storybook/vue3-vite', 'soukai-bis', 'vue'],
        },
    },
    plugins: lazyPlugins(() => [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
        }),
        Aerogel({ lib: true }),
    ]),
    resolve: {
        alias: {
            '@aerogel/storybook': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
