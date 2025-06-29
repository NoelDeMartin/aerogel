import { App, bootServices } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';

import Cloud from '@aerogel/plugin-local-first/services/Cloud';
import { DEFAULT_STATE } from '@aerogel/plugin-local-first/services/Cloud.state';

import settings from './components/settings';

const services = { $cloud: Cloud };

export { Cloud };
export * from './components';
export * from './services/Cloud';

export interface Options {
    manualSetup?: boolean;
}

export type LocalFirstServices = typeof services;

export default function localFirst(options: Options = {}): Plugin {
    return {
        name: '@aerogel/local-first',
        async install(app) {
            settings.forEach((setting) => App.addSetting(setting));

            if (typeof options.manualSetup === 'boolean') {
                DEFAULT_STATE.manualSetup = options.manualSetup;
                Cloud.manualSetup = options.manualSetup;
            }

            await bootServices(app, services);
        },
    };
}

declare module '@aerogel/core' {
    interface Services extends LocalFirstServices {}
}
