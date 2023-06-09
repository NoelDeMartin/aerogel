import Aerogel from '@aerogel/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: { clearMocks: true },
    plugins: [Aerogel()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
