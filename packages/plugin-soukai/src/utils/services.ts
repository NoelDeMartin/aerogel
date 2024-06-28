import { map } from '@noeldemartin/utils';
import { Events } from '@aerogel/core';
import { computed, shallowRef, triggerRef, watchEffect } from 'vue';
import type { Model, ModelConstructor, ModelEvents, ModelListener } from 'soukai';
import type { ComputedRef, Ref } from 'vue';
import type { Service } from '@aerogel/core';

let trackedModels: WeakMap<ModelConstructor, ComputedRef<Model[]>> = new WeakMap();

async function initializeModelCollectionRef<T extends Model>(modelClass: ModelConstructor<T>): Promise<Ref<T[]>> {
    const modelsMap = shallowRef(map([] as T[], 'id'));
    const modelsArray = computed(() => modelsMap.value.getItems());

    trackedModels.set(modelClass, modelsArray);

    modelClass.on('created', (model) => (modelsMap.value.add(model), triggerRef(modelsMap)));
    modelClass.on('deleted', (model) => (modelsMap.value.delete(model), triggerRef(modelsMap)));
    modelClass.on('updated', (model) => (modelsMap.value.add(model), triggerRef(modelsMap)));
    Events.on('auth:logout', () => (modelsMap.value = map([] as T[], 'id')));
    Events.on('cloud:migrated', async () => (modelsMap.value = map(await modelClass.all(), 'id')));

    modelsMap.value = map(await modelClass.all(), 'id');

    return modelsArray;
}

async function getModelCollectionRef<T extends Model>(modelClass: ModelConstructor<T>): Promise<ComputedRef<T[]>> {
    return (trackedModels.get(modelClass) as ComputedRef<T[]>) ?? (await initializeModelCollectionRef<T>(modelClass));
}

export type TrackOptions<TModel extends Model, TKey extends string> = {
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
    return (trackedModels.get(modelClass)?.value as T[]) ?? [];
}

export function resetTrackedModels(): void {
    trackedModels = new WeakMap();
}

export async function trackModelCollection<TModel extends Model, TKey extends string>(
    modelClass: ModelConstructor<TModel>,
    options?: TrackOptions<TModel, TKey>,
): Promise<void> {
    const { service, property: stateKey, transform: optionsTransform, ...eventListeners } = options ?? {};
    const transform = optionsTransform ?? ((models) => models);
    const collectionsRef = await getModelCollectionRef<TModel>(modelClass);

    for (const [event, listener] of Object.entries(eventListeners)) {
        modelClass.on(event as keyof ModelEvents, listener as ModelListener<TModel, keyof ModelEvents>);
    }

    if (service && stateKey) {
        watchEffect(() => service.setState(stateKey, transform(collectionsRef.value)));
    }
}
