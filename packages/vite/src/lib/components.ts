import type { Options } from '@aerogel/vite/lib/options';
import AerogelResolver from '@aerogel/vite/resolvers/AerogelResolver';
import { arrayFilter } from '@noeldemartin/utils';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import type { Plugin } from 'vite';

export function buildComponentsPlugin(options: Options): Plugin | false {
    if (options.lib) {
        return false;
    }

    return Components({
        deep: true,
        dts: 'src/types/components.d.ts',
        dirs: ['src/components', 'src/pages/**/components'],
        resolvers: arrayFilter([
            AerogelResolver(),
            options.icons !== false && IconsResolver({ customCollections: ['app'] }),
        ]),
    });
}
