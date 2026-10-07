import { URL, fileURLToPath } from 'node:url';

import { pack, raw } from '@noeldemartin/vite-plus-config';
import { defineConfig } from 'vite-plus';

const html = raw(/\.html$/);

export default defineConfig({
    pack: {
        ...pack,
        plugins: [html],
        copy: [
            { from: ['src/types/shims.d.ts', 'src/types/virtual.d.ts'], flatten: true },
            { from: 'src/types/exported-env.d.ts', rename: 'env.d.ts' },
        ],
    },
    plugins: [html],
    resolve: {
        alias: {
            '@aerogel/vite': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
