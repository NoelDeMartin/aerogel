import { computed, toRaw } from 'vue';
import { Events, reactiveSet } from '@aerogel/core';
import type { ReactiveSet } from '@aerogel/core';
import type { ComputedRef } from 'vue';
import type { Model, ModelConstructor } from 'soukai';

interface TrackedModelData<T extends object = Model> {
    modelsSet: ReactiveSet<T>;
    modelsArray: ComputedRef<T[]>;
    collectionsSet: Set<string>;
    refresh(): Promise<void>;
}

let trackedModels: WeakMap<ModelConstructor, TrackedModelData> = new WeakMap();

function initializedTrackedModelsData<T extends Model>(modelClass: ModelConstructor<T>): TrackedModelData<T> {
    const modelsSet = reactiveSet<T>();
    const modelsArray = computed(() => modelsSet.values());
    const collectionsSet = new Set<string>([modelClass.collection]);
    const data = {
        modelsSet,
        modelsArray,
        collectionsSet,
        async refresh() {
            const models = new Set<T>();

            for (const collection of collectionsSet) {
                const collectionModels = await modelClass.withCollection(collection, () => modelClass.all());

                collectionModels.forEach((model) => models.add(model));
            }

            modelsSet.reset(models);
        },
    };

    trackedModels.set(modelClass, data);
    modelClass.on('created', (model) => modelsSet.add(toRaw(model)));
    modelClass.on('deleted', (model) => modelsSet.delete(toRaw(model)));
    modelClass.on('updated', (model) => modelsSet.add(toRaw(model)));
    Events.on('purge-storage', () => modelsSet.clear());
    Events.on('cloud:migration-completed', () => data.refresh());
    Events.on('cloud:migration-cancelled', () => data.refresh());
    Events.on('cloud:backup-completed', () => data.refresh());
    Events.emit('soukai:track-models', modelClass);

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

export function _getTrackedModelsData<T extends Model>(modelClass: ModelConstructor<T>): TrackedModelData<T> {
    return (trackedModels.get(modelClass) as TrackedModelData<T>) ?? initializedTrackedModelsData<T>(modelClass);
}

declare module '@aerogel/core' {
    export interface EventsPayload {
        'soukai:track-models': ModelConstructor;
    }
}
