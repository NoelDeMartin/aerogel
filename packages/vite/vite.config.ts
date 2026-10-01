import { URL, fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        entry: { 'aerogel-vite': 'src/index.ts' },
        loader: { '.html': 'text' },
        copy: [{ from: ['src/types/shims.d.ts', 'src/types/virtual.d.ts'], flatten: true }],
        sourcemap: true,
        dts: true,
        fixedExtension: false,
        publint: true,
        attw: { profile: 'esm-only' },
    },
    resolve: {
        alias: {
            '@aerogel/vite': fileURLToPath(new URL('./src/', import.meta.url)),
        },
    },
    test: {
        setupFiles: ['./src/testing/setup.ts'],
    },
});
