import { Storage, once } from '@noeldemartin/utils';
import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from 'vue';
import type { RouteLocationRaw, RouteRecordRaw, Router } from 'vue-router';

function handleStatic404Redirect(router: Router): void {
    const route = Storage.pull<RouteLocationRaw>('static-404-redirect');

    route && router.replace(route);
}

export function createAppRouter(options: { routes: RouteRecordRaw[]; basePath?: string }): Plugin {
    const router = createRouter({
        history: createWebHistory(options.basePath),
        routes: options.routes,
    });

    router.beforeEach(once(() => handleStatic404Redirect(router)));

    return router;
}
