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
                index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                'models-worker': fileURLToPath(new URL('./src/models-worker.ts', import.meta.url)),
                'setup-vitest': fileURLToPath(new URL('./src/setup-vitest.ts', import.meta.url)),
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                '@aerogel/core',
                '@aerogel/vite',
                '@inrupt/solid-client-authn-browser',
                '@noeldemartin/solid-utils',
                '@noeldemartin/utils',
                'solid-auth-client',
                'soukai-bis',
                'soukai-bis/patch-zod',
                'virtual:aerogel',
                'virtual:aerogel-models',
                'virtual:aerogel-models-worker',
                'virtual:aerogel-solid',
                'vite-plus/test',
                'vue',
            ],
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
        Icons(),
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
