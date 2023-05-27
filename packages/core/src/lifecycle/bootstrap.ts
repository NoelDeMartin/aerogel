import { createApp } from 'vue';
import { IndexedDBEngine, bootModelsFromViteGlob, setEngine } from 'soukai';
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import { createAppRouter } from '@/routing';

function bootModels(models: Record<string, Record<string, unknown>>) {
    setEngine(new IndexedDBEngine());
    bootModelsFromViteGlob(models);
}

export interface BootstrapOptions {
    routes?: RouteRecordRaw[];
    models?: Record<string, Record<string, unknown>>;
}

export function bootstrapApplication(rootComponent: Component, options: BootstrapOptions = {}): void {
    options.models && bootModels(options.models);

    const app = createApp(rootComponent);

    options.routes && app.use(createAppRouter({ routes: options.routes }));

    app.mount('#app');
}
