import { URL, fileURLToPath } from 'node:url';

import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-cli',
        },
        rollupOptions: {
            external: [
                '@noeldemartin/utils',
                'chalk',
                'commander',
                'mustache',
                'node:child_process',
                'node:fs',
                'node:path',
                'node:readline',
                'node:url',
                'ts-morph',
            ],
        },
    },
    optimizeDeps: {
        exclude: ['node:child_process', 'node:fs', 'node:path', 'node:readline', 'node:url'],
    },
    plugins: [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
        }),
    ],
    resolve: {
        alias: {
            '@aerogel/cli': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
