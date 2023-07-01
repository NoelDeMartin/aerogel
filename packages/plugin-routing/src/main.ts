import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from '@aerogel/core';
import type { RouteRecordRaw } from 'vue-router';

interface Options {
    routes: RouteRecordRaw[];
    basePath?: string;
}

function createAppRouter(options: { routes: RouteRecordRaw[]; basePath?: string }): Plugin {
    return createRouter({
        history: createWebHistory(options.basePath),
        routes: options.routes,
    });
}

export default function routing(options: Options): Plugin {
    return {
        install(app) {
            const plugin = createAppRouter({
                routes: options.routes,
                basePath: options.basePath ?? __AG_BASE_PATH,
            });

            app.use(plugin);
        },
    };
}
