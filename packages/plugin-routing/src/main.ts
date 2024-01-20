import Aerogel from 'virtual:aerogel';

import { bootServices } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';
import type { RouteRecordRaw } from 'vue-router';

import Router from './services/Router';
import { createAppRouter } from './router';
import type { RouteBindings } from './services/Router';

const services = { $router: Router };

export * from './services/Router';
export * from './utils';
export { default as Router } from './services/Router';

export interface Options {
    routes: RouteRecordRaw[];
    bindings?: RouteBindings;
    basePath?: string;
}

export type RoutingServices = typeof services;

export default function routing(options: Options): Plugin {
    return {
        async install(app) {
            const router = createAppRouter({
                routes: options.routes,
                basePath: options.basePath ?? Aerogel.basePath,
            });

            app.use(router);
            Router.use(router, options);

            await bootServices(app, services);
        },
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends RoutingServices {}
}
