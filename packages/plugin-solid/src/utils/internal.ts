import { Errors, Events, appNamespace, reactiveSet } from '@aerogel/core';
import type { ReactiveSet } from '@aerogel/core';
import ModelsWorker from '@aerogel/plugin-solid/workers/ModelsWorker';
import { arrayUnique, isDevelopment, isInstanceOf, throttle } from '@noeldemartin/utils';
import { DocumentNotFound, IndexedDBEngine, getEngine } from 'soukai-bis';
import type { LoadAllOptions, Model, ModelConstructor, ModelWithUrl } from 'soukai-bis';
import { computed, ref, toRaw } from 'vue';
import type { ComputedRef, Ref } from 'vue';

interface TrackedModelData<T extends Model = Model> {
    depth?: number;
    modelsSet: ReactiveSet<ModelWithUrl<T>>;
    modelsArray: ComputedRef<ModelWithUrl<T>[]>;
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
let trackedContainerUrls: WeakMap<ModelConstructor, string[]> = new WeakMap();
let modelsWorker: ModelsWorker | null = null;

const WORKER_THRESHOLD = 100;

async function countDocuments(engine: IndexedDBEngine, containerUrl: string, depth?: number): Promise<number> {
    try {
        return await engine.countDocuments({ containerUrl, depth });
    } catch (error) {
        if (!isInstanceOf(error, DocumentNotFound)) {
            throw error;
        }

        return 0;
    }
}

async function shouldLoadModelsInWorker(containerUrls: string[], options: { depth?: number }): Promise<boolean> {
    const engine = getEngine();

    if (typeof Worker === 'undefined' || !isInstanceOf(engine, IndexedDBEngine)) {
        return false;
    }

    const documentsCounts = await Promise.all(
        containerUrls.map((containerUrl) => countDocuments(engine, containerUrl, options.depth)),
    );

    return documentsCounts.reduce((total, count) => total + count, 0) >= WORKER_THRESHOLD;
}

async function loadAllModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    containerUrls: string[],
    options: LoadAllOptions,
): Promise<ModelWithUrl<T>[]> {
    const containerModels = await Promise.all(
        containerUrls.map((containerUrl) => modelClass.all({ ...options, from: containerUrl })),
    );

    return uniqueModels(containerModels.flat());
}

function uniqueModels<T extends Model>(models: ModelWithUrl<T>[]): ModelWithUrl<T>[] {
    return Array.from(new Map(models.map((model) => [model.url, model])).values());
}

async function fetchModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { depth?: number; onChunk(models: ModelWithUrl<T>[]): unknown },
): Promise<ModelWithUrl<T>[]> {
    const loadOptions: LoadAllOptions = {
        depth: options.depth,
        async onDocumentError(error, documentUrl) {
            await Errors.report(
                new Error(`Failed loading ${modelClass.modelName} from ${documentUrl}`, { cause: error }),
            );
        },
    };

    const containerUrls = _getTrackedContainerUrls(modelClass);

    if (!(await shouldLoadModelsInWorker(containerUrls, options))) {
        return loadAllModels(modelClass, containerUrls, loadOptions);
    }

    const worker = (modelsWorker ??= new ModelsWorker(appNamespace()));

    try {
        const loadedModels: ModelWithUrl<T>[] = [];

        for (const containerUrl of containerUrls) {
            for await (const chunkModels of worker.loadModels(modelClass, { ...loadOptions, containerUrl })) {
                loadedModels.push(...chunkModels);
                options.onChunk(uniqueModels(loadedModels));
            }
        }

        return uniqueModels(loadedModels);
    } catch (error) {
        if (worker.terminated) {
            throw error;
        }

        if (isDevelopment()) {
            await Errors.report(
                new Error(`Failed loading ${modelClass.modelName} models, retrying without the models worker`, {
                    cause: error,
                }),
            );
        }

        return loadAllModels(modelClass, containerUrls, loadOptions);
    }
}

function initializedTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: TrackedModelOptions = {},
): TrackedModelData<T> {
    let pendingRefresh: Promise<void> | null = null;
    const modelsSet = reactiveSet<ModelWithUrl<T>>(undefined, { key: (model) => model.url });
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
                onChunk: throttle(
                    (chunkModels) =>
                        loaded.value ||
                        modelsSet.reset(withUnloadedTrackedInstances(withTrackedInstances(chunkModels))),
                ),
            });

            modelsSet.reset(loaded.value ? models : withTrackedInstances(models));
            loaded.value = true;
        } finally {
            loading.value = false;
        }
    }

    function withTrackedInstances(models: ModelWithUrl<T>[]): ModelWithUrl<T>[] {
        const trackedInstances = new Map(modelsSet.values().map((model) => [model.url, model]));

        return models.map((model) => {
            const trackedInstance = trackedInstances.get(model.url);

            return trackedInstance && !isNewerModel(model, trackedInstance) ? trackedInstance : model;
        });
    }

    function withUnloadedTrackedInstances(loadedModels: ModelWithUrl<T>[]): ModelWithUrl<T>[] {
        const loadedUrls = new Set(loadedModels.map((model) => model.url));

        return loadedModels.concat(modelsSet.values().filter((model) => !loadedUrls.has(model.url)));
    }

    trackedModels.set(modelClass, data);
    modelClass.on('created', (model) => model.hasUrl() && modelsSet.add(toRaw(model)));
    modelClass.on('deleted', (model) => model.hasUrl() && modelsSet.delete(toRaw(model)));
    modelClass.on('updated', (model) => model.hasUrl() && modelsSet.add(toRaw(model)));
    Events.on('cloud:backup-completed', () => (loaded.value || loading.value) && data.refresh());
    Events.on('purge-storage', () => {
        loaded.value = false;
        modelsSet.clear();
    });

    void Events.emit('solid:track-models', modelClass);

    return data;
}

function isNewerModel(model: Model, otherModel: Model): boolean {
    return (model.updatedAt?.getTime() ?? 0) > (otherModel.updatedAt?.getTime() ?? 0);
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

export function _getTrackedContainerUrls(modelClass: ModelConstructor): string[] {
    return trackedContainerUrls.get(modelClass) ?? [modelClass.defaultContainerUrl];
}

export function _setTrackedContainerUrls(modelClass: ModelConstructor, containerUrls: string[] | null): void {
    if (!containerUrls || containerUrls.length === 0) {
        trackedContainerUrls.delete(modelClass);

        return;
    }

    trackedContainerUrls.set(modelClass, arrayUnique(containerUrls));
}

export function _resetModelsState(): void {
    trackedModels = new WeakMap();
    trackedContainerUrls = new WeakMap();

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
