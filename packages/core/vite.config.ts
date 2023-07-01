import Aerogel from '@aerogel/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: { clearMocks: true },
    plugins: [Aerogel(), I18n({ include: resolve(__dirname, './src/testing/stubs/lang/**/*.yaml') })],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
