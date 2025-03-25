import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import Icons from 'unplugin-icons/vite';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-plugin-local-first',
        },
        rollupOptions: {
            external: [
                '@aerogel/core',
                '@aerogel/vite',
                '@inrupt/solid-client-authn-browser',
                '@noeldemartin/solid-utils',
                '@noeldemartin/utils',
                'solid-auth-client',
                'soukai-solid',
                'soukai',
                'vue',
            ],
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
    ],
    resolve: {
        alias: {
            '@aerogel/plugin-local-first': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        clearMocks: true,
        setupFiles: ['./src/testing/setup.ts'],
    },
});
