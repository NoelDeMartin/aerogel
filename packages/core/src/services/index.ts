import type { App } from 'vue';

import Events from './Events';
import Service from './Service';
import { defineBootstrapHook } from '@/bootstrap/hooks';

export * from './Events';
export * from './Service';

export { Events, Service };

const defaultServices = {
    $events: Events,
};

export type DefaultServices = typeof defaultServices;

export interface Services extends DefaultServices {}

export async function bootServices(app: App, services: Record<string, Service>): Promise<void> {
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
