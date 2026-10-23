import { bootCoreModels, bootModelsFromViteGlob, setEngine, setNamespace } from 'soukai-bis';
import type { Engine } from 'soukai-bis';

export type ModelsGlob = Record<string, Record<string, unknown>>;

export function bootModels(models: ModelsGlob = {}): void {
    bootCoreModels({ reset: true });
    bootModelsFromViteGlob(models, { reset: true });
}

export function setupSoukai(options: { engine: Engine; namespace: string; models?: ModelsGlob }): void {
    setEngine(options.engine);
    setNamespace(options.namespace);
    bootModels(options.models);
}
