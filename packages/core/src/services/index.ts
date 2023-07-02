import type { App as VueApp } from 'vue';

import App from './App';
import Events from './Events';
import Lang from './Lang';
import Service from './Service';
import { defineBootstrapHook } from '@/bootstrap/hooks';

export * from './App';
export * from './Events';
export * from './Lang';
export * from './Service';

export { App, Events, Lang, Service };

const defaultServices = {
    $app: App,
    $events: Events,
    $lang: Lang,
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

export default defineBootstrapHook((app) => bootServices(app, defaultServices));

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends Services {}
}
