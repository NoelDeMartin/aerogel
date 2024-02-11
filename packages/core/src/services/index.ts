import type { App as VueApp } from 'vue';

import { definePlugin } from '@/plugins';

import App from './App';
import Events from './Events';
import Service from './Service';
import { getPiniaStore } from './store';

export * from './App';
export * from './Events';
export * from './Service';
export * from './store';

export { App, Events, Service };

const defaultServices = {
    $app: App,
    $events: Events,
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

    App.development && Object.assign(window, services);
}

export default definePlugin({
    async install(app, options) {
        const services = {
            ...defaultServices,
            ...options.services,
        };

        app.use(getPiniaStore());

        await bootServices(app, services);
    },
});

declare module '@/bootstrap/options' {
    export interface AerogelOptions {
        services?: Record<string, Service>;
    }
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends Services {}
}
