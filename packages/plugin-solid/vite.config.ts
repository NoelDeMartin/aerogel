import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import { externalDependencies } from '@noeldemartin/vite-plus-config';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                'models-worker': fileURLToPath(new URL('./src/models-worker.ts', import.meta.url)),
                'setup-vitest': fileURLToPath(new URL('./src/setup-vitest.ts', import.meta.url)),
            },
            formats: ['es'],
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
            exclude: ['src/setup-vitest.ts', 'src/models-worker.ts'],
        }),
        Aerogel({ lib: true }),
    ]),
    resolve: {
        alias: {
            '@aerogel/plugin-solid': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
