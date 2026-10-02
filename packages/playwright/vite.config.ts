import { URL, fileURLToPath } from 'node:url';

import { pack } from '@noeldemartin/vite-plus-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack,
    resolve: {
        alias: {
            '@aerogel/playwright': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
