import type { Options } from '@aerogel/vite/lib/options';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import type { Plugin } from 'vite';

export function buildI18nPlugin(options: Options): Plugin | Plugin[] | false {
    if (options.lib) {
        return false;
    }

    return I18n({ include: ['**/src/lang/**/*.yaml', '**/src/modules/*/lang/**/*.yaml'] });
}

export function generateMessagesVirtualModule(): string {
    return `export default import.meta.glob(['/src/lang/*.yaml', '/src/modules/*/lang/*.yaml']);`;
}
