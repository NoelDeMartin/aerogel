import { Errors, Events, appNamespace, reactiveSet } from '@aerogel/core';
import type { ReactiveSet } from '@aerogel/core';
import { RELATIONS_LOAD_BATCH_SIZE } from '@aerogel/plugin-solid/utils/constants';
import ModelsWorker from '@aerogel/plugin-solid/workers/ModelsWorker';
import { afterAnimationFrame, arrayChunk, isDevelopment, isInstanceOf } from '@noeldemartin/utils';
import { DocumentNotFound, IndexedDBEngine, getEngine } from 'soukai-bis';
import type { Model, ModelConstructor } from 'soukai-bis';
import { computed, ref, toRaw } from 'vue';
import type { ComputedRef, Ref } from 'vue';

interface TrackedModelData<T extends object = Model> {
    depth?: number;
    modelsSet: ReactiveSet<T>;
    modelsArray: ComputedRef<T[]>;
    loading: Ref<boolean>;
    loaded: Ref<boolean>;
    load(): Promise<void>;
    refresh(): Promise<void>;
}

type TrackedModelOptions = {
    load?: boolean;
    depth?: number;
};

let trackedModels: WeakMap<ModelConstructor, TrackedModelData> = new WeakMap();
let modelsWorker: ModelsWorker | null = null;

const WORKER_THRESHOLD = 100;

function canUseModelsWorker(engine: unknown): engine is IndexedDBEngine {
    return typeof Worker !== 'undefined' && isInstanceOf(engine, IndexedDBEngine);
}

function getModelsWorker(): ModelsWorker {
    return (modelsWorker ??= new ModelsWorker(appNamespace()));
}

async function reportWorkerFailure(worker: ModelsWorker, message: string, error: unknown): Promise<void> {
    if (worker.terminated) {
        throw error;
    }

    if (isDevelopment()) {
        await Errors.report(new Error(message, { cause: error }));
    }
}

async function shouldLoadModelsInWorker(modelClass: ModelConstructor, options: { depth?: number }): Promise<boolean> {
    const engine = getEngine();

    if (!canUseModelsWorker(engine)) {
        return false;
    }

    try {
        const documentsCount = await engine.countDocuments({
            containerUrl: modelClass.defaultContainerUrl,
            depth: options.depth,
        });

        return documentsCount >= WORKER_THRESHOLD;
    } catch (error) {
        if (!isInstanceOf(error, DocumentNotFound)) {
            throw error;
        }

        return false;
    }
}

async function fetchModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { depth?: number; onChunk(models: T[]): unknown },
): Promise<T[]> {
    if (!(await shouldLoadModelsInWorker(modelClass, options))) {
        return modelClass.all({ depth: options.depth });
    }

    const worker = getModelsWorker();

    try {
        const loadedModels: T[] = [];

        for await (const chunkModels of worker.loadModels(modelClass, { depth: options.depth })) {
            loadedModels.push(...chunkModels);
            options.onChunk(loadedModels.slice(0));
        }

        return loadedModels;
    } catch (error) {
        await reportWorkerFailure(
            worker,
            `Failed loading ${modelClass.modelName} models, retrying without the models worker`,
            error,
        );

        return modelClass.all({ depth: options.depth });
    }
}

async function loadRelationsInWorker<T extends Model>(
    modelClass: ModelConstructor<T>,
    models: T[],
    relations: string[],
): Promise<void> {
    const worker = getModelsWorker();
    const modelsByUrl = new Map(models.map((model) => [model.requireUrl(), model]));

    try {
        for await (const serializedModels of worker.loadRelations(modelClass, [...modelsByUrl.keys()], relations)) {
            for (const [url, serializedModel] of Object.entries(serializedModels)) {
                await modelsByUrl.get(url)?.hydrateRelations(serializedModel);
            }
        }
    } catch (error) {
        await reportWorkerFailure(
            worker,
            `Failed loading ${modelClass.modelName} relations, retrying without the models worker`,
            error,
        );
    }
}

async function loadRelationsInMainThread(models: Model[], relations: string[]): Promise<void> {
    for (const batch of arrayChunk(models, RELATIONS_LOAD_BATCH_SIZE)) {
        await Promise.all(
            batch.map(async (model) => {
                for (const relation of relations) {
                    await model.loadRelationIfUnloaded(relation);
                }
            }),
        );

        await afterAnimationFrame();
    }
}

function initializedTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: TrackedModelOptions = {},
): TrackedModelData<T> {
    let pendingRefresh: Promise<void> | null = null;
    const modelsSet = reactiveSet<T>(undefined, { equals: (a, b) => a.url === b.url });
    const modelsArray = computed(() => modelsSet.values());
    const loading = ref(false);
    const loaded = ref(false);
    const data: TrackedModelData<T> = {
        depth: options.depth,
        modelsSet,
        modelsArray,
        loading,
        loaded,
        async load() {
            if (loaded.value) {
                return;
            }

            await (pendingRefresh ?? data.refresh());
        },
        refresh() {
            const refresh = performRefresh().finally(() => pendingRefresh === refresh && (pendingRefresh = null));

            return (pendingRefresh = refresh);
        },
    };

    async function performRefresh(): Promise<void> {
        loading.value = true;

        try {
            const models = await fetchModels(modelClass, {
                depth: data.depth,
                onChunk: (chunkModels) => loaded.value || modelsSet.reset(withTrackedInstances(chunkModels)),
            });

            modelsSet.reset(loaded.value ? models : withTrackedInstances(models));
            loaded.value = true;
        } finally {
            loading.value = false;
        }
    }

    function withTrackedInstances(models: T[]): T[] {
        const trackedInstances = new Map(modelsSet.values().map((model) => [model.url, model]));

        return models.map((model) => trackedInstances.get(model.url) ?? model);
    }

    trackedModels.set(modelClass, data);
    modelClass.on('created', (model) => modelsSet.add(toRaw(model)));
    modelClass.on('deleted', (model) => modelsSet.delete(toRaw(model)));
    modelClass.on('updated', (model) => modelsSet.add(toRaw(model)));
    Events.on('cloud:backup-completed', () => (loaded.value || loading.value) && data.refresh());
    Events.on('purge-storage', () => {
        loaded.value = false;
        modelsSet.clear();
    });

    void Events.emit('solid:track-models', modelClass);

    return data;
}

export async function _loadRelations<T extends Model>(
    modelClass: ModelConstructor<T>,
    models: T[],
    relations: string[],
): Promise<void> {
    const unloadedModels = models.filter((model) => relations.some((relation) => !model.isRelationLoaded(relation)));
    const workerModels = unloadedModels.filter((model) => model.url && model.exists() && !model.isDirty());

    if (canUseModelsWorker(getEngine()) && workerModels.length >= WORKER_THRESHOLD) {
        await loadRelationsInWorker(modelClass, workerModels, relations);
    }

    const remainingModels = unloadedModels.filter((model) =>
        relations.some((relation) => !model.isRelationLoaded(relation)),
    );

    if (remainingModels.length > 0) {
        await loadRelationsInMainThread(remainingModels, relations);
    }
}

export function isSoftDeleted(model: Model): boolean {
    if (!('isSoftDeleted' in model)) {
        return false;
    }

    return (model as { isSoftDeleted(): boolean }).isSoftDeleted();
}

export function _getTrackedModels(): WeakMap<ModelConstructor, TrackedModelData> {
    return trackedModels;
}

export function _resetModelsState(): void {
    trackedModels = new WeakMap();

    modelsWorker?.terminate();
    modelsWorker = null;
}

export function _getTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: TrackedModelOptions = {},
): TrackedModelData<T> {
    const data =
        (trackedModels.get(modelClass) as TrackedModelData<T>) ?? initializedTrackedModelsData<T>(modelClass, options);

    if (options.depth !== undefined && data.depth !== options.depth) {
        throw new Error('Model collection is already being tracked with a different depth');
    }

    if (options.load) {
        data.load().catch((error) => Errors.report(error));
    }

    return data;
}

declare module '@aerogel/core' {
    export interface EventsPayload {
        'solid:track-models': ModelConstructor;
    }
}
