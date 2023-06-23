import Aerogel, { AerogelResolver } from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { resolve } from 'path';

export default {
    plugins: [
        Aerogel(),
        Icons(),
        I18n({ include: resolve(__dirname, './src/lang/**/*.yaml') }),
        Components({
            dirs: ['src/pages', 'src/components'],
            dts: false,
            resolvers: [AerogelResolver(), IconsResolver()],
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
};
