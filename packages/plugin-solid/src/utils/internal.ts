import { Errors, Events, reactiveSet } from '@aerogel/core';
import type { ReactiveSet } from '@aerogel/core';
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
            const models = await modelClass.all({ depth: data.depth });

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

export function isSoftDeleted(model: Model): boolean {
    if (!('isSoftDeleted' in model)) {
        return false;
    }

    return (model as { isSoftDeleted(): boolean }).isSoftDeleted();
}

export function _getTrackedModels(): WeakMap<ModelConstructor, TrackedModelData> {
    return trackedModels;
}

export function _setTrackedModels(value: WeakMap<ModelConstructor, TrackedModelData>): void {
    trackedModels = value;
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
