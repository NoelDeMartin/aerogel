import { computed, toRaw } from 'vue';
import { Events, reactiveSet } from '@aerogel/core';
import type { ReactiveSet } from '@aerogel/core';
import type { ComputedRef } from 'vue';
import type { Model, ModelConstructor } from 'soukai-bis';

interface TrackedModelData<T extends object = Model> {
    fetch: boolean;
    depth?: number;
    modelsSet: ReactiveSet<T>;
    modelsArray: ComputedRef<T[]>;
    refresh(): Promise<void>;
}

type TrackedModelOptions = {
    fetch?: boolean;
    depth?: number;
};

let trackedModels: WeakMap<ModelConstructor, TrackedModelData> = new WeakMap();

function initializedTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: TrackedModelOptions = {},
): TrackedModelData<T> {
    const modelsSet = reactiveSet<T>(undefined, { equals: (a, b) => a.url === b.url });
    const modelsArray = computed(() => modelsSet.values());
    const data = {
        fetch: options.fetch ?? true,
        depth: options.depth,
        modelsSet,
        modelsArray,
        async refresh() {
            if (!data.fetch) {
                return;
            }

            const models = await modelClass.all({ depth: data.depth });

            modelsSet.reset(models);
        },
    };

    trackedModels.set(modelClass, data);
    modelClass.on('created', (model) => modelsSet.add(toRaw(model)));
    modelClass.on('deleted', (model) => modelsSet.delete(toRaw(model)));
    modelClass.on('updated', (model) => modelsSet.add(toRaw(model)));
    Events.on('purge-storage', () => modelsSet.clear());
    Events.on('cloud:backup-completed', () => data.refresh());
    Events.emit('solid:track-models', modelClass);

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

    if (options.fetch !== undefined && data.fetch !== options.fetch) {
        throw new Error('Model collection is already being tracked with a different fetching behavior');
    }

    return data;
}

declare module '@aerogel/core' {
    export interface EventsPayload {
        'solid:track-models': ModelConstructor;
    }
}
