import App from '@aerogel/core/services/App';
import { bootServices } from '@aerogel/core/services';
import { definePlugin } from '@aerogel/core/plugins';

import Lang from './Lang';
import settings from './settings';
import { translate, translateWithDefault } from './utils';
import type { LangProvider } from './Lang';

export { Lang, translate, translateWithDefault };
export type { LangProvider };

const services = { $lang: Lang };

export type LangServices = typeof services;

export default definePlugin({
    async install(app) {
        app.config.globalProperties.$t ??= translate;
        app.config.globalProperties.$td = translateWithDefault;

        settings.forEach((setting) => App.addSetting(setting));

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/services' {
    export interface Services extends LangServices {}
}

declare module 'vue' {
    interface ComponentCustomProperties {
        $td: typeof translateWithDefault;
    }
}
