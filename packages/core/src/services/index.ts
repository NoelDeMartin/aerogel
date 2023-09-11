import type { App as VueApp } from 'vue';

import { definePlugin } from '@/plugins';

import App from './App';
import Events from './Events';
import Service from './Service';

export * from './App';
export * from './Events';
export * from './Service';

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
            // eslint-disable-next-line no-console
            await service.launch(name.slice(1)).catch((error) => console.error(error));
        }),
    );

    Object.assign(app.config.globalProperties, services);
}

export default definePlugin({
    async install(app, options) {
        const services = {
            ...defaultServices,
            ...options.services,
        };

        await bootServices(app, services);
    },
});

declare module '@/bootstrap/options' {
    interface AerogelOptions {
        services?: Record<string, Service>;
    }
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends Services {}
}
