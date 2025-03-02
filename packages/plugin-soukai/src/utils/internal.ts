import { computed, shallowRef, toRaw, triggerRef } from 'vue';
import { Events } from '@aerogel/core';
import { map } from '@noeldemartin/utils';
import type { ComputedRef, Ref } from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { ObjectsMap } from '@noeldemartin/utils';

interface TrackedModelData<T extends object = Model> {
    modelsMap: Ref<ObjectsMap<T>>;
    modelsArray: ComputedRef<T[]>;
    collectionsSet: Set<string>;
    refresh(): Promise<void>;
}

let trackedModels: WeakMap<ModelConstructor, TrackedModelData> = new WeakMap();

function initializedTrackedModelsData<T extends Model>(modelClass: ModelConstructor<T>): TrackedModelData<T> {
    const modelsMap = shallowRef(map([] as T[], 'id'));
    const modelsArray = computed(() => modelsMap.value.getItems());
    const collectionsSet = new Set<string>([modelClass.collection]);
    const data = {
        modelsMap,
        modelsArray,
        collectionsSet,
        async refresh() {
            const models = map([] as T[], 'id');

            for (const collection of collectionsSet) {
                const collectionModels = await modelClass.withCollection(collection, () => modelClass.all());

                collectionModels.forEach((model) => models.add(model));
            }

            modelsMap.value = models;
        },
    };

    trackedModels.set(modelClass, data);
    modelClass.on('created', (model) => (modelsMap.value.add(toRaw(model)), triggerRef(modelsMap)));
    modelClass.on('deleted', (model) => (modelsMap.value.delete(toRaw(model)), triggerRef(modelsMap)));
    modelClass.on('updated', (model) => (modelsMap.value.add(toRaw(model)), triggerRef(modelsMap)));
    Events.on('purge-storage', () => (modelsMap.value = map([] as T[], 'id')));
    Events.on('cloud:migration-completed', () => data.refresh());
    Events.on('cloud:migration-cancelled', () => data.refresh());
    Events.on('cloud:backup-completed', () => data.refresh());

    return data;
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
