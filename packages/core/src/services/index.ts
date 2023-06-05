import { Events } from './Events';

export * from './Events';
export * from './Service';

const services = {
    $events: Events,
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
