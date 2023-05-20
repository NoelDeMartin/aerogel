import Aerogel, { AerogelResolver } from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import { resolve } from 'path';

export default {
    plugins: [
        Aerogel(),
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
