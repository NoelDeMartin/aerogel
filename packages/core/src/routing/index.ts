import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from 'vue';

import { defineBootstrapHook } from '@/bootstrap/hooks';

function createAppRouter(options: { routes: RouteRecordRaw[]; basePath?: string }): Plugin {
    return createRouter({
        history: createWebHistory(options.basePath),
        routes: options.routes,
    });
}

export default defineBootstrapHook(async (app, options) => {
    if (!options.routes) {
        return;
    }

    const plugin = createAppRouter({
        routes: options.routes,
        basePath: options.basePath ?? __AG_BASE_PATH,
    });

    app.use(plugin);
});

declare module '@/bootstrap/options' {
    interface BootstrapOptions {
        routes?: RouteRecordRaw[];
        basePath?: string;
    }
}

import type { RouteRecordRaw } from 'vue-router';
