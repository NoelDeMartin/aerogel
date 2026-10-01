import { URL, fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        entry: { 'aerogel-storybook': 'src/index.ts' },
        sourcemap: true,
        dts: true,
        fixedExtension: false,
        publint: true,
        attw: { profile: 'esm-only' },
    },
    resolve: {
        alias: {
            '@aerogel/storybook': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
});
