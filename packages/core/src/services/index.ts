import Events from './Events';
import Service from './Service';
import UI from './UI';

export * from './Events';
export * from './Service';
export * from './UI';

export { Events, Service, UI };

const services = {
    $events: Events,
    $ui: UI,
};

type BaseServices = typeof services;

export interface Services extends BaseServices {}

export async function bootServices(): Promise<Services> {
    await Promise.all(
        Object.entries(services).map(async ([name, service]) => {
            // eslint-disable-next-line no-console
            await service.launch(name.slice(1)).catch((error) => console.error(error));
        }),
    );

    return services;
}

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties extends Services {}
}
