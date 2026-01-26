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
            fileName: 'aerogel-plugin-soukai',
        },
        rollupOptions: {
            external: ['@aerogel/core', 'soukai', 'soukai-bis', '@noeldemartin/utils', 'virtual:aerogel', 'vue'],
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
            '@aerogel/plugin-soukai': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
