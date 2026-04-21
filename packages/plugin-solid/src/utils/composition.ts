import {
    computed,
    customRef,
    getCurrentScope,
    onScopeDispose,
    onUnmounted,
    reactive,
    shallowRef,
    watchEffect,
} from 'vue';
import { onCleanMounted } from '@aerogel/core';
import { isArray, isInstanceOf, isObject, tap } from '@noeldemartin/utils';
import { Model, getRelatedClasses } from 'soukai-bis';
import type { ModelConstructor, ModelEvents, ModelListener } from 'soukai-bis';
import type { ComputedRef, Ref } from 'vue';

import { _getTrackedModelsData, isSoftDeleted } from './internal';
import { throttle } from '@aerogel/plugin-solid/utils/timing';

function mapModels<T extends Model>(
    models: unknown,
    existingMap?: Map<string, T>,
    deep: boolean = true,
): Map<string, T> {
    const map = existingMap ?? new Map();

    if (isArray(models)) {
        models.forEach((model) => map.set(model.url, model));

        return map;
    }

    if (isObject(models)) {
        if (deep) {
            Object.values(models).forEach((value) => mapModels(value, map, false));

            return map;
        }

        map.set(models.url as string, models as T);

        return map;
    }

    return map;
}

function shallowComputedModels<T>(modelClass: ModelConstructor, compute: () => T): ComputedRef<T> {
    return customRef((track, trigger) => {
        let value: T;
        const recompute = () => ((value = compute()), trigger());
        const listeners: Array<() => void> = [
            modelClass.on('deleted', recompute),
            modelClass.on('created', recompute),
            modelClass.on('updated', recompute),
            modelClass.on('modified', recompute),
            modelClass.on('relation-loaded', recompute),
        ];
        const stopListeners = () => {
            listeners.forEach((stop) => stop());
            listeners.splice(0, listeners.length);
        };

        getCurrentScope() && onScopeDispose(stopListeners);
        watchEffect(recompute);

        return {
            get: () => tap(value, () => track()),

            // eslint-disable-next-line no-console
            set: () => console.warn('Computed models ref was not set (it is immutable).'),
        };
    }) as ComputedRef<T>;
}

function reactiveComputedModels<T>(modelClass: ModelConstructor, compute: () => T): ComputedRef<T> {
    const shallowModels = shallowComputedModels(modelClass, compute);
    const reactiveModels = computed(() => {
        if (isArray(shallowModels.value)) {
            return shallowModels.value
                .filter((shallowModel) => !isSoftDeleted(shallowModel))
                .map((shallowModel) => reactive(shallowModel)) as T;
        }

        if (isObject(shallowModels.value)) {
            return Object.entries(shallowModels.value).reduce((models, [name, value]) => {
                if (isArray(value)) {
                    models[name as keyof T] = value
                        .filter((shallowModel) => !isSoftDeleted(shallowModel))
                        .map((shallowModel) => reactive(shallowModel)) as T[keyof T];
                } else if (!isSoftDeleted(value as Model)) {
                    models[name as keyof T] = reactive(value as Model) as T[keyof T];
                }

                return models;
            }, {} as T);
        }

        return shallowModels.value;
    });
    const reactiveModelsMap = computed(() => mapModels(reactiveModels.value));
    const stop = modelClass.on('modified', (updatedModel, field) => {
        if (!updatedModel.url) {
            return;
        }

        Object.assign(reactiveModelsMap.value.get(updatedModel.url) ?? {}, {
            [field]: updatedModel.getAttribute(field),
        });
    });

    onUnmounted(stop);

    return reactiveModels;
}

export type RefValue<T> = T extends Ref<infer TValue> ? TValue : never;

export function computedModel<T>(compute: () => T): Readonly<Ref<T>> {
    return customRef((track, trigger) => {
        let value: T;
        const listeners: Array<() => void> = [];
        const onModelUpdated = throttle(trigger);
        const stopListeners = () => {
            listeners.forEach((stop) => stop());
            listeners.splice(0, listeners.length);
        };

        getCurrentScope() && onScopeDispose(stopListeners);
        watchEffect(() => {
            const newValue = compute();

            if (value instanceof Model && (!isInstanceOf(newValue, Model) || newValue.static() !== value.static())) {
                stopListeners();
            }

            value = newValue;
            trigger();

            if (!isInstanceOf(value, Model) || listeners.length) {
                return;
            }

            for (const modelClass of getRelatedClasses(value.static())) {
                listeners.push(modelClass.on('modified', onModelUpdated));
                listeners.push(modelClass.on('updated', onModelUpdated));
                listeners.push(modelClass.on('deleted', onModelUpdated));
                listeners.push(modelClass.on('relation-loaded', onModelUpdated));
            }
        });

        return {
            get: () => tap(value, () => track()),

            // eslint-disable-next-line no-console
            set: () => console.warn('Computed model ref was not set (it is immutable).'),
        };
    });
}

export function computedModels<T>(modelClass: ModelConstructor, compute: () => T): ComputedRef<T> {
    // TODO This implementation is probably very inefficient and needs to be improved for better performance with large
    // collections. There are also more details in the unit tests for this function.
    return reactiveComputedModels(modelClass, compute);
}

export function useModelCollection<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean; depth?: number } = {},
): Ref<T[]> {
    const models = shallowRef([]) as Ref<T[]>;
    const modelData = _getTrackedModelsData<T>(modelClass, { depth: options?.depth });

    watchEffect(() => (models.value = modelData.modelsArray.value));
    onCleanMounted(() => modelClass.on('updated', () => (models.value = models.value.slice(0))));

    return computed(() => {
        if (options.includeSoftDeleted) {
            return models.value;
        }

        return models.value.filter((model) => !isSoftDeleted(model));
    });
}

export function useModelEvent<TModel extends Model, TEvent extends keyof ModelEvents>(
    modelClass: ModelConstructor<TModel>,
    event: TEvent,
    listener: ModelListener<TModel, TEvent>,
): void {
    const cleanUp = modelClass.on(event, listener);

    onUnmounted(cleanUp);
}
