import { bootServices } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';

import Cloud from '@/services/Cloud';

const services = { $cloud: Cloud };

export { Cloud };
export * from './components';
export * from './services/Cloud';

export type OfflineFirstServices = typeof services;

export default function offlineFirst(): Plugin {
    return {
        name: '@aerogel/offline-first',
        async install(app) {
            await bootServices(app, services);
        },
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends OfflineFirstServices {}
}
