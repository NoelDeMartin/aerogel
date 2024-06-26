import Aerogel from '@aerogel/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        clearMocks: true,
        setupFiles: ['./src/testing/setup.ts'],
    },
    plugins: [Aerogel()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),

            // TODO not sure why it doesn't work without this :/
            '@aerogel/core': resolve(__dirname, '../core/dist/aerogel-core.esm.js'),
        },
    },
});
