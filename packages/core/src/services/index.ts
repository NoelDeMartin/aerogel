import { definePlugin } from '@aerogel/core/plugins';
import type { AppSetting } from '@aerogel/core/utils/settings';
import { isDevelopment, isTesting } from '@noeldemartin/utils';
import type { App as AppInstance } from 'vue';

import App from './App';
import Browser from './Browser';
import Cache from './Cache';
import Events from './Events';
import NetworkCache from './NetworkCache';
import Service from './Service';
import settings from './settings';
import Storage from './Storage';
import { getPiniaStore } from './store';

export * from './App';
export * from './Browser';
export * from './Cache';
export * from './Events';
export * from './NetworkCache';
export * from './Service';
export * from './store';
export * from './utils';

export { App, Browser, Cache, Events, NetworkCache, Storage, Service };

const defaultServices = {
    $app: App,
    $browser: Browser,
    $cache: Cache,
    $events: Events,
    $storage: Storage,
};

export type DefaultServices = typeof defaultServices;

export interface Services extends DefaultServices {}

export async function bootServices(app: AppInstance, services: Record<string, Service>): Promise<void> {
    Object.assign(app.config.globalProperties, services);

    await Promise.all(
        Object.entries(services).map(async ([name, service]) => {
            await service
                .launch()
                .catch((error) => app.config.errorHandler?.(error, null, `Failed launching ${name}.`));
        }),
    );

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
        settings.forEach((setting) => App.addSetting(setting));
        options.settings?.forEach((setting) => App.addSetting(setting));

        if (options.settingsFullscreenOnMobile !== undefined) {
            App.setSettingsFullscreenOnMobile(options.settingsFullscreenOnMobile);
        }

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/bootstrap/options' {
    export interface AerogelOptions {
        services?: Record<string, Service>;
        settings?: AppSetting[];
        settingsFullscreenOnMobile?: boolean;
    }
}

declare module 'vue' {
    interface ComponentCustomProperties extends Services {}
}
