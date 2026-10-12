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
            entry: { index: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
            formats: ['es'],
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
            '@aerogel/storybook': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
