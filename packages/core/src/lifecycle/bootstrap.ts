import { createApp } from 'vue';
import { IndexedDBEngine, bootModelsFromViteGlob, setEngine } from 'soukai';
import type { Component } from 'vue';

function bootModels(models: Record<string, Record<string, unknown>>) {
    setEngine(new IndexedDBEngine());
    bootModelsFromViteGlob(models);
}

export interface BootstrapOptions {
    models?: Record<string, Record<string, unknown>>;
}

export function bootstrapApplication(rootComponent: Component, options: BootstrapOptions = {}): void {
    options.models && bootModels(options.models);

    const app = createApp(rootComponent);

    app.mount('#app');
}
