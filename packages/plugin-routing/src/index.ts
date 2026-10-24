import { UI, bootServices, setMarkdownRouter } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';
import Aerogel from 'virtual:aerogel';
import { RouterLink, createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import Router from './services/Router';
import type { RouteBindings } from './services/Router';

const services = { $router: Router };

export * from './services/Router';
export * from './utils';
export * from './components';
export { default as Router } from './services/Router';

export interface Options {
    routes?: RouteRecordRaw[];
    bindings?: RouteBindings;
    basePath?: string;
}

export type RoutingServices = typeof services;

export default function routing(options: Options = {}): Plugin {
    return {
        async install(app, appOptions) {
            const modules = appOptions.modules ?? [];
            const routes = [...modules.flatMap((module) => module.routes ?? []), ...(options.routes ?? [])];
            const bindings: RouteBindings = Object.assign(
                {},
                ...modules.map((module) => module.bindings),
                options.bindings,
            );
            const router = createRouter({
                routes,
                history: createWebHistory(options.basePath ?? Aerogel.basePath),
            });

            UI.registerComponent('router-link', RouterLink);
            Router.use(router, { bindings });
            app.use(router);

            setMarkdownRouter({
                resolve: (route) => router.resolve({ name: route }).href,
                visit: async (route) => void (await router.push({ name: route })),
            });

            await bootServices(app, services);
        },
    };
}

declare module '@aerogel/core' {
    interface Services extends RoutingServices {}
    interface AerogelModule {
        routes?: RouteRecordRaw[];
        bindings?: RouteBindings;
    }
}
