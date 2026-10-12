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
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-plugin-local-first',
        },
        rollupOptions: {
            external: externalDependencies(packageJson),
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
            '@aerogel/plugin-local-first': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
