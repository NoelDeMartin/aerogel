import { URL, fileURLToPath } from 'node:url';

import Aerogel from '@aerogel/vite';
import Icons from 'unplugin-icons/vite';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'aerogel-plugin-routing',
        },
        rollupOptions: {
            external: [
                '@aerogel/core',
                '@aerogel/plugin-solid',
                '@aerogel/vite',
                '@noeldemartin/utils',
                'soukai-bis',
                'virtual:aerogel',
                'vue-router',
                'vue',
            ],
        },
    },
    plugins: lazyPlugins(() => [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            insertTypesEntry: true,
        }),
        Aerogel({ lib: true }),
        Icons(),
    ]),
    resolve: {
        alias: {
            '@aerogel/plugin-routing': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
