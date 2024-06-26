import Aerogel from '@aerogel/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        clearMocks: true,
        setupFiles: ['./src/testing/setup.ts'],
    },
    plugins: [Aerogel(), Icons()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
