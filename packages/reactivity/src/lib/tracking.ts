import { getTrackedModelsData, getTrackedModelsMap } from '@aerogel/reactivity/internals/tracking';
import type { Model, ModelConstructor, ModelWithUrl } from 'soukai-bis';

export { clearTrackedModels, resetReactiveState } from '@aerogel/reactivity/internals/tracking';

export interface TrackOptions {
    depth?: number;
}

export function getTrackedModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean } = {},
): ModelWithUrl<T>[] {
    const models = (getTrackedModelsMap().get(modelClass)?.modelsArray.value as ModelWithUrl<T>[]) ?? [];

    if (options.includeSoftDeleted) {
        return models;
    }

    return models.filter((model) => !model.isSoftDeleted());
}

export function getTrackedSingletonModel<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean } = {},
): ModelWithUrl<T> | null {
    return getTrackedModels(modelClass, options)[0] ?? null;
}

export async function loadTrackedSingletonModel<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean } = {},
): Promise<ModelWithUrl<T> | null> {
    await loadTrackedModels(modelClass);

    return getTrackedSingletonModel(modelClass, options);
}

export async function refreshTrackedModels(modelClass: ModelConstructor): Promise<void> {
    if (!getTrackedModelsMap().has(modelClass)) {
        return;
    }

    const modelData = getTrackedModelsData(modelClass);

    if (!modelData.loaded.value && !modelData.loading.value) {
        return;
    }

    await modelData.refresh();
}

export async function findTrackedModel<T extends Model>(
    modelClass: ModelConstructor<T>,
    url: string,
): Promise<ModelWithUrl<T> | null> {
    const modelData = getTrackedModelsData<T>(modelClass);
    const findInstance = () => modelData.modelsMap.get(url);
    const trackedModel = findInstance();

    if (trackedModel) {
        return trackedModel;
    }

    const model = await modelClass.find(url, { includeSoftDeleted: true });

    if (!model || modelData.loaded.value) {
        return model;
    }

    modelData.modelsMap.add(model);

    return findInstance() ?? model;
}

export async function loadTrackedModels(modelClass: ModelConstructor): Promise<void> {
    await getTrackedModelsData(modelClass).load();
}

export function trackModels(modelClass: ModelConstructor, options: TrackOptions = {}): void {
    getTrackedModelsData(modelClass, { depth: options.depth });
}
