import { IndexedDBEngine, bootCoreModels, bootModelsFromViteGlob, setEngine, setNamespace } from 'soukai-bis';

export type ModelsGlob = Record<string, Record<string, unknown>>;

export function bootModels(models: ModelsGlob = {}): void {
    bootCoreModels({ reset: true });
    bootModelsFromViteGlob(models, { reset: true });
}

export function setupSoukai(options: { namespace: string; models?: ModelsGlob }): IndexedDBEngine {
    const engine = new IndexedDBEngine();

    setEngine(engine);
    setNamespace(options.namespace);
    bootModels(options.models);

    return engine;
}
