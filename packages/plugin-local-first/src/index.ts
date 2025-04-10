import { App, bootServices } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';

import Cloud from '@aerogel/plugin-local-first/services/Cloud';
import DocumentsCache from '@aerogel/plugin-local-first/services/DocumentsCache';

import settings from './components/settings';

const services = { $cloud: Cloud };

export { Cloud };
export * from './components';
export * from './services/Cloud';

export type LocalFirstServices = typeof services;

export default function localFirst(): Plugin {
    return {
        name: '@aerogel/local-first',
        async install(app) {
            settings.forEach((setting) => App.addSetting(setting));

            await bootServices(app, {
                ...services,
                $_documentsCache: DocumentsCache,
            });
        },
    };
}

declare module '@aerogel/core' {
    interface Services extends LocalFirstServices {}
}
