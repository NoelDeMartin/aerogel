import { URL, fileURLToPath } from 'node:url';

import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-vite',
        },
        rollupOptions: {
            external: [
                '@noeldemartin/utils',
                '@tailwindcss/vite',
                '@vitejs/plugin-vue',
                'mustache',
                'node:child_process',
                'node:fs',
                'node:path',
                'rollup',
                'unplugin-vue-components',
                'vite-plugin-pwa',
            ],
        },
    },
    optimizeDeps: {
        exclude: ['node:child_process', 'node:fs', 'node:path'],
    },
    plugins: [
        {
            name: 'ignore',
            load(id) {
                if (id.endsWith('?ignore')) {
                    return { code: '', map: null };
                }

                return null;
            },
        },
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
        }),
    ],
    resolve: {
        alias: {
            '@aerogel/vite': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
