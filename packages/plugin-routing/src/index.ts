import Aerogel from 'virtual:aerogel';

import { bootServices } from '@aerogel/core';
import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from '@aerogel/core';
import type { RouteRecordRaw } from 'vue-router';

import Router from './services/Router';
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
            const router = createRouter({
                routes: options.routes,
                history: createWebHistory(options.basePath ?? Aerogel.basePath),
            });

            Router.use(router, options);
            app.use(router);

            await bootServices(app, services);
        },
    };
}

declare module '@aerogel/core' {
    interface Services extends RoutingServices {}
}
