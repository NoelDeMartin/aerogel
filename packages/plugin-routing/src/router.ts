import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

export function createAppRouter(options: { routes: RouteRecordRaw[]; basePath?: string }): Plugin {
    return createRouter({
        history: createWebHistory(options.basePath),
        routes: options.routes,
    });
}
