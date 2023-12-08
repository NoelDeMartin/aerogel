import Aerogel from 'virtual:aerogel';

import { bootServices } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';
import type { RouteRecordRaw } from 'vue-router';

import Router from './services/Router';
import { createAppRouter } from './router';

const services = { $router: Router };

export { Router };

export interface Options {
    routes: RouteRecordRaw[];
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

            Router.router = router;

            await bootServices(app, services);
        },
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends RoutingServices {}
}
