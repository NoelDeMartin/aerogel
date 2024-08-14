import { map, required } from '@noeldemartin/utils';
import { Events } from '@aerogel/core';
import { computed, shallowRef, triggerRef, watchEffect } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type { Model, ModelConstructor, ModelEvents, ModelListener } from 'soukai';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { Service } from '@aerogel/core';

interface TrackedModelData<T extends object = Model> {
    modelsMap: Ref<ObjectsMap<T>>;
    modelsArray: ComputedRef<T[]>;
    collectionsSet: Set<string>;
}

let trackedModels: WeakMap<ModelConstructor, TrackedModelData> = new WeakMap();

async function initializedTrackedModelsData<T extends Model>(
    modelClass: ModelConstructor<T>,
): Promise<TrackedModelData<T>> {
    const modelsMap = shallowRef(map([] as T[], 'id'));
    const modelsArray = computed(() => modelsMap.value.getItems());
    const collectionsSet = new Set<string>([modelClass.collection]);
    const data = { modelsMap, modelsArray, collectionsSet };
    const refresh = async () => {
        const models = map([] as T[], 'id');

        for (const collection of collectionsSet) {
            const collectionModels = await modelClass.withCollection(collection, () => modelClass.all());

            collectionModels.forEach((model) => models.add(model));
        }

        modelsMap.value = models;
    };

    trackedModels.set(modelClass, data);
    modelClass.on('created', (model) => (modelsMap.value.add(model), triggerRef(modelsMap)));
    modelClass.on('deleted', (model) => (modelsMap.value.delete(model), triggerRef(modelsMap)));
    modelClass.on('updated', (model) => (modelsMap.value.add(model), triggerRef(modelsMap)));
    Events.on('auth:logout', () => (modelsMap.value = map([] as T[], 'id')));
    Events.on('cloud:migrated', () => refresh());

    await refresh();

    return data;
}

async function getTrackedModelsData<T extends Model>(modelClass: ModelConstructor<T>): Promise<TrackedModelData<T>> {
    return (
        (trackedModels.get(modelClass) as TrackedModelData<T>) ?? (await initializedTrackedModelsData<T>(modelClass))
    );
}

export interface TrackCollectionsOptions {
    refresh?: boolean;
}

export type TrackOptions<TModel extends Model = Model, TKey extends string = string> = {
    service?: ModelService<TModel, TKey>;
    property?: TKey;
    transform?: (models: TModel[]) => TModel[];
} & {
    [K in keyof ModelEvents]?: ModelListener<TModel, K>;
};

export type ModelService<TModel extends Model = Model, TKey extends string = string> = Service<{
    [K in TKey]: TModel[];
}>;

export function getTrackedModels<T extends Model>(modelClass: ModelConstructor<T>): T[] {
    return (trackedModels.get(modelClass)?.modelsArray.value as T[]) ?? [];
}

export function resetTrackedModels(): void {
    trackedModels = new WeakMap();
}

export function ignoreModelsCollection(modelClass: ModelConstructor, collection: string): void {
    const modelData = required(
        trackedModels.get(modelClass),
        'Failed ignoring models collection, please track the model first using trackModels()',
    );

    modelData.collectionsSet.delete(collection);
}

export async function trackModelsCollection(
    modelClass: ModelConstructor,
    collection: string,
    options: TrackCollectionsOptions = {},
): Promise<void> {
    const refresh = options.refresh ?? true;
    const modelData = required(
        trackedModels.get(modelClass),
        'Failed tracking models collection, please track the model first using trackModels()',
    );

    if (modelData.collectionsSet.has(collection)) {
        return;
    }

    modelData.collectionsSet.add(collection);

    if (refresh) {
        const models = modelData.modelsArray.value;
        const collectionModels = await modelClass.withCollection(collection, () => modelClass.all());

        collectionModels.forEach((model) => models.push(model));
        modelData.modelsMap.value = map(models, 'id');
    }
}

export async function trackModels<TModel extends Model, TKey extends string>(
    modelClass: ModelConstructor<TModel>,
    options?: TrackOptions<TModel, TKey>,
): Promise<void> {
    const { service, property: stateKey, transform: optionsTransform, ...eventListeners } = options ?? {};
    const transform = optionsTransform ?? ((models) => models);
    const modelData = await getTrackedModelsData<TModel>(modelClass);

    for (const [event, listener] of Object.entries(eventListeners)) {
        modelClass.on(event as keyof ModelEvents, listener as ModelListener<TModel, keyof ModelEvents>);
    }

    if (service && stateKey) {
        watchEffect(() => service.setState(stateKey, transform(modelData.modelsArray.value)));
    }
}
