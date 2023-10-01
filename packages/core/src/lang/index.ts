import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import Lang, { LangProvider } from './Lang';
import { translate, translateWithDefault } from './utils';

export { Lang, LangProvider, translate, translateWithDefault };

const services = { $lang: Lang };

export type LangServices = typeof services;

export default definePlugin({
    async install(app) {
        app.config.globalProperties.$t ??= translate;
        app.config.globalProperties.$td = translateWithDefault;

        await bootServices(app, services);
    },
});

declare module '@/services' {
    export interface Services extends LangServices {}
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $td: typeof translateWithDefault;
    }
}
