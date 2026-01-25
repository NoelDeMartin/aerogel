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
            fileName: 'aerogel-plugin-solid',
        },
        rollupOptions: {
            external: [
                '@aerogel/core',
                '@aerogel/plugin-soukai',
                '@aerogel/vite',
                '@inrupt/solid-client-authn-browser',
                '@noeldemartin/solid-utils',
                '@noeldemartin/utils',
                'solid-auth-client',
                'soukai-bis',
                'soukai-solid',
                'soukai',
                'virtual:aerogel-solid',
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
            '@aerogel/plugin-solid': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        clearMocks: true,
        setupFiles: ['./src/testing/setup.ts'],
    },
});
