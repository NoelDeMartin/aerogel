import Aerogel from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import { resolve } from 'path';

export default {
    plugins: [
        Aerogel(),
        Components({
            dirs: ['src/pages'],
            dts: false,
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
};
