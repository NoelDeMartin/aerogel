import { config } from '@aerogel/reactivity/internals/config';
import type { LoadAllOptions, Model, ModelConstructor, ModelWithUrl } from 'soukai-bis';

export interface ComputedModelsCache {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<unknown>;
}

export interface ModelsWorker {
    readonly terminated: boolean;
    loadModels<T extends Model>(
        modelClass: ModelConstructor<T>,
        options: LoadAllOptions & { containerUrl: string },
    ): AsyncIterable<ModelWithUrl<T>[]>;
    terminate(): void;
}

export function setErrorReporter(reportError: (error: unknown) => unknown): void {
    config.reportError = reportError;
}

export function setComputedModelsCache(cache: ComputedModelsCache): void {
    config.computedModelsCache = cache;
}

export function setModelsWorkerLoader(createWorker: () => ModelsWorker): void {
    config.createModelsWorker = createWorker;
}
