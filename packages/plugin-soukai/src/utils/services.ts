import { map, required } from '@noeldemartin/utils';
import { watchEffect } from 'vue';
import type { Model, ModelConstructor, ModelEvents, ModelListener } from 'soukai';
import type { Service } from '@aerogel/core';

import { _getTrackedModels, _getTrackedModelsData, _setTrackedModels, isSoftDeleted } from './internal';

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

export function getTrackedModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean } = {},
): T[] {
    const models = (_getTrackedModels().get(modelClass)?.modelsArray.value as T[]) ?? [];

    if (options.includeSoftDeleted) {
        return models;
    }

    return models.filter((model) => !isSoftDeleted(model));
}

export function resetTrackedModels(): void {
    _setTrackedModels(new WeakMap());
}

export function ignoreModelsCollection(modelClass: ModelConstructor, collection: string): void {
    const modelData = required(
        _getTrackedModels().get(modelClass),
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
        _getTrackedModels().get(modelClass),
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
    const modelData = _getTrackedModelsData<TModel>(modelClass);

    for (const [event, listener] of Object.entries(eventListeners)) {
        modelClass.on(event as keyof ModelEvents, listener as ModelListener<TModel, keyof ModelEvents>);
    }

    if (service && stateKey) {
        watchEffect(() => service.setState(stateKey, transform(modelData.modelsArray.value)));
    }

    await modelData.refresh();
}
