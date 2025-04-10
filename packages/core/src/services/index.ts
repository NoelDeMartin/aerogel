import type { App as VueApp } from 'vue';

import { definePlugin } from '@aerogel/core/plugins';
import { isDevelopment, isTesting } from '@noeldemartin/utils';

import App from './App';
import Cache from './Cache';
import Events from './Events';
import Service from './Service';
import Storage from './Storage';
import { getPiniaStore } from './store';
import type { AppSetting } from './App.state';

export * from './App';
export * from './Cache';
export * from './Events';
export * from './Service';
export * from './store';
export * from './utils';

export { App, Cache, Events, Storage, Service };

const defaultServices = {
    $app: App,
    $events: Events,
    $storage: Storage,
};

export type DefaultServices = typeof defaultServices;

export interface Services extends DefaultServices {}

export async function bootServices(app: VueApp, services: Record<string, Service>): Promise<void> {
    await Promise.all(
        Object.entries(services).map(async ([name, service]) => {
            await service
                .launch()
                .catch((error) => app.config.errorHandler?.(error, null, `Failed launching ${name}.`));
        }),
    );

    Object.assign(app.config.globalProperties, services);

    if (isDevelopment() || isTesting()) {
        Object.assign(globalThis, services);
    }
}

export default definePlugin({
    async install(app, options) {
        const services = {
            ...defaultServices,
            ...options.services,
        };

        app.use(getPiniaStore());
        options.settings?.forEach((setting) => App.addSetting(setting));

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/bootstrap/options' {
    export interface AerogelOptions {
        services?: Record<string, Service>;
        settings?: AppSetting[];
    }
}

declare module 'vue' {
    interface ComponentCustomProperties extends Services {}
}
