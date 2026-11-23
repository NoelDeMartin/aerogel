import { config } from '@aerogel/reactivity/internals/config';
import { resetLocalChanges } from '@aerogel/reactivity/internals/local-changes';
import { resetSyncSession } from '@aerogel/reactivity/internals/sync';
import type { ModelsWorker } from '@aerogel/reactivity/lib/config';
import { arrayUnique, isDevelopment, isInstanceOf, isTruthy, throttle, urlRoute } from '@noeldemartin/utils';
import { reactiveMap } from '@noeldemartin/utils/vue';
import type { ReactiveMap } from '@noeldemartin/utils/vue';
import { DocumentNotFound, IndexedDBEngine, Sync, getEngine } from 'soukai-bis';
import type { LoadAllOptions, Model, ModelConstructor, ModelInstanceEvent, ModelWithUrl } from 'soukai-bis';
import { computed, ref, toRaw } from 'vue';
import type { ComputedRef, Ref } from 'vue';

interface TrackedModelData<T extends Model = Model> {
    depth?: number;
    modelsMap: ReactiveMap<ModelWithUrl<T>, string>;
    modelsArray: ComputedRef<ModelWithUrl<T>[]>;
    loading: Ref<boolean>;
    loaded: Ref<boolean>;
    load(urls?: string[]): Promise<void>;
    refresh(): Promise<void>;
}

type TrackedModelOptions = {
    load?: boolean;
    depth?: number;
};

let trackedModels: WeakMap<ModelConstructor, TrackedModelData> = new WeakMap();
let modelsWorker: ModelsWorker | null = null;
let stopListeningSync: (() => void) | null = null;
const clearListeners = new Set<() => void>();

const WORKER_THRESHOLD = 100;
const MODEL_CHANGE_EVENTS: ModelInstanceEvent[] = ['created', 'updated', 'deleted', 'modified', 'relation-loaded'];

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

async function loadModelsByContainer<T extends Model>(
    modelClass: ModelConstructor<T>,
    containerUrls: string[],
    options: LoadAllOptions,
): Promise<ModelWithUrl<T>[]> {
    const containerModels = await Promise.all(
        containerUrls.map((containerUrl) => modelClass.all({ ...options, from: containerUrl })),
    );

    return uniqueModels(containerModels.flat());
}

async function loadModelsByUrl<T extends Model>(
    modelClass: ModelConstructor<T>,
    modelUrls: string[],
    options: LoadAllOptions,
): Promise<ModelWithUrl<T>[]> {
    const models = await Promise.all(
        modelUrls.map(async (modelUrl) => {
            try {
                return await modelClass.find(modelUrl, { includeSoftDeleted: true });
            } catch (error) {
                await options.onDocumentError?.(error, urlRoute(modelUrl));

                return null;
            }
        }),
    );

    return models.filter(isTruthy);
}

function uniqueModels<T extends Model>(models: ModelWithUrl<T>[]): ModelWithUrl<T>[] {
    return Array.from(new Map(models.map((model) => [model.url, model])).values());
}

function createLoadOptions<T extends Model>(modelClass: ModelConstructor<T>, depth?: number): LoadAllOptions {
    return {
        depth,
        includeSoftDeleted: true,
        async onDocumentError(error, documentUrl) {
            await config.reportError(
                new Error(`Failed loading ${modelClass.modelName} from ${documentUrl}`, { cause: error }),
            );
        },
    };
}

async function fetchModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { depth?: number; onChunk(models: ModelWithUrl<T>[]): unknown },
): Promise<ModelWithUrl<T>[]> {
    const loadOptions = createLoadOptions(modelClass, options.depth);
    const urls = getTrackedUrls(modelClass);
    const containerUrls = urls.filter((url) => url.endsWith('/'));
    const modelUrls = urls.filter((url) => !url.endsWith('/'));
    const createWorker = config.createModelsWorker;

    if (!createWorker || !(await shouldLoadModelsInWorker(containerUrls, options))) {
        const [urlModels, containerModels] = await Promise.all([
            loadModelsByUrl(modelClass, modelUrls, loadOptions),
            loadModelsByContainer(modelClass, containerUrls, loadOptions),
        ]);

        return uniqueModels([...urlModels, ...containerModels]);
    }

    const worker = (modelsWorker ??= createWorker());
    const urlModels = await loadModelsByUrl(modelClass, modelUrls, loadOptions);

    try {
        const loadedModels: ModelWithUrl<T>[] = [...urlModels];

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
            await config.reportError(
                new Error(`Failed loading ${modelClass.modelName} models, retrying without the models worker`, {
                    cause: error,
                }),
            );
        }

        return uniqueModels([...urlModels, ...(await loadModelsByContainer(modelClass, containerUrls, loadOptions))]);
    }
}

async function refreshRegisteredModels(): Promise<void> {
    for (const { model, registration } of Sync.models) {
        const data = trackedModels.get(model);

        if (!registration || !data || (!data.loaded.value && !data.loading.value)) {
            continue;
        }

        await data.refresh();
    }
}

export function listenSync(): void {
    if (stopListeningSync) {
        return;
    }

    stopListeningSync = Sync.listeners.add({ onSyncCompleted: () => refreshRegisteredModels() });
}

function initializedTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: TrackedModelOptions = {},
): TrackedModelData<T> {
    let pendingRefresh: Promise<void> | null = null;
    const pendingUrls = new Map<string, Promise<void>>();
    const modelsMap = reactiveMap<ModelWithUrl<T>, string>(undefined, { key: (model) => model.url });
    const modelsArray = computed(() => modelsMap.values());
    const loading = ref(false);
    const loaded = ref(false);
    const data: TrackedModelData<T> = {
        depth: options.depth,
        modelsMap,
        modelsArray,
        loading,
        loaded,
        async load(urls?: string[]) {
            if (loaded.value) {
                return;
            }

            if (urls) {
                await performLoadUrls(urls);

                return;
            }

            await (pendingRefresh ?? data.refresh());
        },
        refresh() {
            const refresh = performRefresh().finally(() => pendingRefresh === refresh && (pendingRefresh = null));

            return (pendingRefresh = refresh);
        },
    };

    async function performLoadUrls(urls: string[]): Promise<void> {
        const pendingUrlPromises: Promise<void>[] = [];
        const missingUrls: string[] = [];

        for (const url of arrayUnique(urls)) {
            if (modelsMap.get(url)) {
                continue;
            }

            const pendingUrlPromise = pendingUrls.get(url);

            if (pendingUrlPromise) {
                pendingUrlPromises.push(pendingUrlPromise);
                continue;
            }

            missingUrls.push(url);
        }

        if (missingUrls.length > 0) {
            const loadOptions = createLoadOptions(modelClass, data.depth);
            const fetchPromise = loadModelsByUrl(modelClass, missingUrls, loadOptions)
                .then((models) => mergeTrackedInstances(models))
                .finally(() => {
                    for (const url of missingUrls) {
                        if (pendingUrls.get(url) !== fetchPromise) {
                            continue;
                        }

                        pendingUrls.delete(url);
                    }
                });

            for (const url of missingUrls) {
                pendingUrls.set(url, fetchPromise);
            }

            pendingUrlPromises.push(fetchPromise);
        }

        await Promise.all(pendingUrlPromises);
    }

    async function performRefresh(): Promise<void> {
        loading.value = true;

        try {
            const models = await fetchModels(modelClass, {
                depth: data.depth,
                onChunk: throttle(
                    (chunkModels) =>
                        loaded.value ||
                        modelsMap.reset(withUnloadedTrackedInstances(withTrackedInstances(chunkModels))),
                ),
            });

            modelsMap.reset(loaded.value ? models : withTrackedInstances(models));
            loaded.value = true;
        } finally {
            loading.value = false;
        }
    }

    function mergeTrackedInstances(models: ModelWithUrl<T>[]): void {
        for (const model of models) {
            const trackedInstance = modelsMap.get(model.url);

            if (trackedInstance && !isNewerModel(model, trackedInstance)) {
                continue;
            }

            modelsMap.replace(model);
        }
    }

    function withTrackedInstances(models: ModelWithUrl<T>[]): ModelWithUrl<T>[] {
        return models.map((model) => {
            const trackedInstance = modelsMap.get(model.url);

            return trackedInstance && !isNewerModel(model, trackedInstance) ? trackedInstance : model;
        });
    }

    function withUnloadedTrackedInstances(loadedModels: ModelWithUrl<T>[]): ModelWithUrl<T>[] {
        const loadedUrls = new Set(loadedModels.map((model) => model.url));

        return loadedModels.concat(modelsMap.values().filter((model) => !loadedUrls.has(model.url)));
    }

    trackedModels.set(modelClass, data);
    modelClass.on('created', ({ model }) => model.hasUrl() && modelsMap.add(toRaw(model)));
    modelClass.on('deleted', ({ model }) => model.hasUrl() && modelsMap.delete(toRaw(model)));
    modelClass.on('updated', ({ model }) => model.hasUrl() && modelsMap.add(toRaw(model)));
    onTrackedModelsCleared(() => {
        loaded.value = false;
        modelsMap.clear();
    });

    return data;
}

function isNewerModel(model: Model, otherModel: Model): boolean {
    return (model.updatedAt?.getTime() ?? 0) > (otherModel.updatedAt?.getTime() ?? 0);
}

export function listenToModelChanges(modelClass: ModelConstructor, listener: () => void): Array<() => void> {
    return MODEL_CHANGE_EVENTS.map((event) => modelClass.on(event, listener));
}

export function getTrackedModelsMap(): WeakMap<ModelConstructor, TrackedModelData> {
    return trackedModels;
}

export function getTrackedUrls(modelClass: ModelConstructor): string[] {
    return Sync.getDiscoveryUrls(modelClass);
}

export function onTrackedModelsCleared(listener: () => void): () => void {
    clearListeners.add(listener);

    return () => clearListeners.delete(listener);
}

export function clearTrackedModels(): void {
    clearListeners.forEach((listener) => listener());
}

export function resetModelsState(): void {
    trackedModels = new WeakMap();

    modelsWorker?.terminate();
    modelsWorker = null;

    stopListeningSync?.();
    stopListeningSync = null;

    clearListeners.clear();
    resetLocalChanges();
    resetSyncSession();
}

export function getTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: TrackedModelOptions = {},
): TrackedModelData<T> {
    const data =
        (trackedModels.get(modelClass) as TrackedModelData<T>) ?? initializedTrackedModelsData<T>(modelClass, options);

    if (options.depth !== undefined && data.depth !== options.depth) {
        throw new Error('Model collection is already being tracked with a different depth');
    }

    if (options.load) {
        data.load().catch((error) => config.reportError(error));
    }

    return data;
}
