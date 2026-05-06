import { watchEffect } from 'vue';
import type { Model, ModelConstructor, ModelEvents, ModelListener } from 'soukai-bis';
import { App, type Service } from '@aerogel/core';

import { _getTrackedModels, _getTrackedModelsData, _setTrackedModels, isSoftDeleted } from './internal';

export interface TrackCollectionsOptions {
    refresh?: boolean;
}

export type TrackOptions<TModel extends Model = Model, TKey extends string = string> = {
    service?: ModelService<TModel, TKey>;
    property?: TKey;
    transform?: (models: TModel[]) => TModel[];
    depth?: number;
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

export function isTrackingModel(modelClass: ModelConstructor): boolean {
    return _getTrackedModels().has(modelClass);
}

export function resetTrackedModels(): void {
    _setTrackedModels(new WeakMap());
}

export async function refreshTrackedModels(modelClass: ModelConstructor): Promise<void> {
    await _getTrackedModelsData(modelClass).refresh();
}

export async function trackModels<TModel extends Model, TKey extends string>(
    modelClass: ModelConstructor<TModel>,
    options?: TrackOptions<TModel, TKey>,
): Promise<void> {
    if (App.plugin('@aerogel/local-first')) {
        await App.service('$cloud')?.booted;
    }

    const { service, property: stateKey, transform: optionsTransform, ...eventListeners } = options ?? {};
    const transform = optionsTransform ?? ((models) => models);
    const wasTracked = _getTrackedModels().has(modelClass);
    const modelData = _getTrackedModelsData<TModel>(modelClass, { depth: options?.depth });

    for (const [event, listener] of Object.entries(eventListeners)) {
        modelClass.on(event as keyof ModelEvents, listener as ModelListener<TModel, keyof ModelEvents>);
    }

    if (service && stateKey) {
        watchEffect(() => service.setState(stateKey, transform(modelData.modelsArray.value)));
    }

    wasTracked || (await modelData.refresh());
}
