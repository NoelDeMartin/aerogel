import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from 'vue';

import { defineBootstrapHook } from '@/bootstrap/hooks';

function createAppRouter(routes: RouteRecordRaw[]): Plugin {
    return createRouter({
        history: createWebHistory(),
        routes,
    });
}

export default defineBootstrapHook(async (app, options) => {
    if (!options.routes) {
        return;
    }

    const plugin = createAppRouter(options.routes);

    app.use(plugin);
});

declare module '@/bootstrap/options' {
    interface BootstrapOptions {
        routes?: RouteRecordRaw[];
    }
}

import type { RouteRecordRaw } from 'vue-router';
