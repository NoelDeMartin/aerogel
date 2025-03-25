import { URL, fileURLToPath } from 'node:url';

import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                'aerogel-cypress': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                'config': fileURLToPath(new URL('./src/config/index.ts', import.meta.url)),
                'support': fileURLToPath(new URL('./src/support/index.ts', import.meta.url)),
            },
            formats: ['es'],
            fileName: (_, entry) => {
                if (entry.includes('config')) {
                    return 'config.js';
                }

                if (entry.includes('support')) {
                    return 'support.js';
                }

                return 'aerogel-cypress.js';
            },
        },
        rollupOptions: {
            external: [
                '@noeldemartin/utils',
                '@simonsmith/cypress-image-snapshot/command',
                '@simonsmith/cypress-image-snapshot/plugin',
                'cypress-solid',
                'cypress-solid/config',
                'idb',
                'soukai',
            ],
        },
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
            '@aerogel/cypress': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
