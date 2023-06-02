import Aerogel, { AerogelResolver } from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import { resolve } from 'path';

export default {
    plugins: [
        Aerogel(),
        I18n({ include: resolve(__dirname, './src/lang/**/*.yaml') }),
        Components({
            dirs: ['src/pages', 'src/components'],
            dts: false,
            resolvers: [AerogelResolver()],
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
};
