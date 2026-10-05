import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import Icons from 'unplugin-icons/vite';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                'index': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                'setup-vitest': fileURLToPath(new URL('./src/setup-vitest.ts', import.meta.url)),
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                '@noeldemartin/testing',
                '@noeldemartin/utils',
                '@noeldemartin/vue-modals',
                'class-variance-authority',
                'clsx',
                'dompurify',
                'eruda',
                'eruda-indexeddb',
                'marked',
                'pinia',
                'reka-ui',
                'tailwind-merge',
                'virtual:aerogel',
                'vite-plus/test',
                'vue',
                'vue-component-type-helpers',
                'zod',
            ],
        },
    },
    plugins: lazyPlugins(() => [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
            exclude: ['src/setup-vitest.ts'],
        }),
        Aerogel({ lib: true }),
        Icons(),
    ]),
    resolve: {
        alias: {
            '@aerogel/core': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        environment: 'happy-dom',
        setupFiles: ['./src/testing/setup.ts'],
    },
});
