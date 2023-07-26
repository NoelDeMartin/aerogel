import { Lang } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';

import I18nLangProvider from './I18nLangProvider';
import { createAppI18n } from './i18n';
import type { Options } from './options';

export default function i18n(options: Options): Plugin {
    return {
        async install(app) {
            const plugin = await createAppI18n(options);

            app.use(plugin);

            Lang.setProvider(new I18nLangProvider(plugin.global));
        },
    };
}
