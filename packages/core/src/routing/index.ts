import { createRouter, createWebHistory } from 'vue-router';
import type { Plugin } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

interface RouteOptions {
    routes: RouteRecordRaw[];
}

export function createAppRouter(options: RouteOptions): Plugin {
    return createRouter({
        history: createWebHistory(),
        routes: options.routes,
    });
}
