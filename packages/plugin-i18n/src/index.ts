import { Lang } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';
import appMessages from 'virtual:aerogel-messages';

import { createAppI18n, loadAppLocales } from './i18n';
import I18nLangProvider from './I18nLangProvider';
import I18nMessages from './I18nMessages';
import type { Options } from './options';

export default function i18n(options: Options = {}): Plugin {
    return {
        async install(app) {
            const messages = new I18nMessages(appMessages);
            const plugin = createAppI18n({ ...options, messages });

            app.use(plugin);

            void Lang.setProvider(new I18nLangProvider(plugin.global, messages));

            await loadAppLocales({ ...options, messages });
        },
    };
}
