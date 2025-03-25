import { bootServices } from '@aerogel/core/services';
import { definePlugin } from '@aerogel/core/plugins';

import Lang from './Lang';
import type { LangProvider } from './Lang';
import { translate, translateWithDefault } from './utils';

export { Lang, translate, translateWithDefault };
export type { LangProvider };

const services = { $lang: Lang };

export type LangServices = typeof services;

export default definePlugin({
    async install(app) {
        app.config.globalProperties.$t ??= translate;
        app.config.globalProperties.$td = translateWithDefault;

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/services' {
    export interface Services extends LangServices {}
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $td: typeof translateWithDefault;
    }
}
