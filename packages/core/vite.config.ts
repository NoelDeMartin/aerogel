import I18n from '@intlify/unplugin-vue-i18n/vite';
import Vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const isTesting = process.env.NODE_ENV === 'test';

export default defineConfig({
    test: { clearMocks: true },
    plugins: [Vue(), I18n({ include: resolve(__dirname, './src/testing/stubs/lang/**/*.yaml') })],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    define: isTesting ? { __AG_BASE_PATH: 'undefined' } : undefined,
});
