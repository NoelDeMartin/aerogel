import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import Lang, { LangProvider } from './Lang';

export { Lang, LangProvider };

const services = { $lang: Lang };

export type LangServices = typeof services;

export const translate = Lang.translate.bind(Lang);
export const translateWithDefault = Lang.translateWithDefault.bind(Lang);

export default definePlugin({
    async install(app) {
        app.config.globalProperties.$t ??= translate;
        app.config.globalProperties.$td = translateWithDefault;

        await bootServices(app, services);
    },
});

declare module '@/services' {
    interface Services extends LangServices {}
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $td: typeof translateWithDefault;
    }
}
