import { onCleanMounted } from '@aerogel/core';
import { fail, isArray, isInstanceOf, isObject, tap, throttle } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { Model, getRelatedClasses } from 'soukai-bis';
import type { ComputedAttribute, ModelConstructor, ModelEvents, ModelListener } from 'soukai-bis';
import {
    computed,
    customRef,
    getCurrentScope,
    onScopeDispose,
    readonly,
    shallowReactive,
    shallowRef,
    toRaw,
    toValue,
    watchEffect,
} from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

import { IS_REACTIVE, RAW } from './flags';
import { _getTrackedModelsData, isSoftDeleted } from './internal';

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

function watchComputedAttributes(modelClass: ModelConstructor, attributes: string[], callback: () => void) {
    const modelData = _getTrackedModelsData(modelClass);
    const subscriptions = new Map<Model, () => void>();

    watchEffect(() => {
        const watchedModels = new Set(modelData.modelsArray.value);

        for (const [model, unsubscribe] of subscriptions.entries()) {
            if (watchedModels.has(model)) {
                continue;
            }

            unsubscribe();
            subscriptions.delete(model);
        }

        modelData.modelsArray.value.forEach((model) => {
            if (!model.url || subscriptions.has(model)) {
                return;
            }

            const unsubscribes = attributes.map((attribute) => {
                const computedAttribute = toRaw(model).getComputedAttribute(attribute);

                return computedAttribute.subscribe(callback);
            });

            subscriptions.set(model, () => unsubscribes.forEach((unsubscribe) => unsubscribe()));
        });
    });

    getCurrentScope() && onScopeDispose(() => subscriptions.forEach((unsubscribe) => unsubscribe()));
}

function shallowComputedModels<T>(
    modelClass: ModelConstructor,
    compute: () => T,
    options: ComputedModelsOptions = {},
): ComputedRef<T> {
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

        watchEffect(recompute);
        watchComputedAttributes(modelClass, options.watch ?? [], recompute);
        getCurrentScope() && onScopeDispose(() => listeners.forEach((stop) => stop()));

        return {
            get: () => tap(value, () => track()),

            // oxlint-disable-next-line no-console
            set: () => console.warn('Computed models ref was not set (it is immutable).'),
        };
    }) as ComputedRef<T>;
}

function reactiveComputedModels<T>(
    modelClass: ModelConstructor,
    compute: () => T,
    options: ComputedModelsOptions = {},
): ComputedRef<T> {
    const shallowModels = shallowComputedModels(modelClass, compute, options);
    const reactiveModels = computed(() => {
        if (isArray(shallowModels.value)) {
            return shallowModels.value
                .filter((shallowModel) => !isSoftDeleted(shallowModel))
                .map((shallowModel) => shallowReactive(shallowModel)) as T;
        }

        if (isObject(shallowModels.value)) {
            return Object.entries(shallowModels.value).reduce((models, [name, value]) => {
                if (isArray(value)) {
                    models[name as keyof T] = value
                        .filter((shallowModel) => !isSoftDeleted(shallowModel))
                        .map((shallowModel) => shallowReactive(shallowModel)) as T[keyof T];
                } else if (!isSoftDeleted(value as Model)) {
                    models[name as keyof T] = shallowReactive(value as Model) as T[keyof T];
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

    getCurrentScope() && onScopeDispose(stop);

    return reactiveModels;
}

function createModelProxy<T extends object>(model: T, track: () => void, trigger: () => void): T {
    return new Proxy(model, {
        get(target, prop, receiver) {
            if (prop === RAW) {
                return target;
            }

            if (prop === IS_REACTIVE) {
                return true;
            }

            track();
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, val, receiver) {
            const result = Reflect.set(target, prop, val, receiver);

            trigger();

            return result;
        },
    });
}

export type RefValue<T> = T extends Ref<infer TValue> ? TValue : never;

export interface ComputedModelsOptions {
    watch?: string[];
}

export interface UseModelsResult<T extends Model> {
    models: ComputedRef<T[]>;
    loading: ComputedRef<boolean>;
    refreshing: Readonly<Ref<boolean>>;
}

export function computedModel<T>(compute: () => T): Readonly<Ref<T>> {
    return customRef((track, trigger) => {
        let value: T;
        let rawValue: T;
        let proxy: T | null = null;
        const listeners: Array<() => void> = [];
        const onModelUpdated = throttle(trigger);
        const stopListeners = () => {
            listeners.forEach((stop) => stop());
            listeners.splice(0, listeners.length);
        };

        getCurrentScope() && onScopeDispose(stopListeners);
        watchEffect(() => {
            const newValue = toRaw(compute());

            if (
                rawValue instanceof Model &&
                (!isInstanceOf(newValue, Model) || newValue.static() !== rawValue.static())
            ) {
                stopListeners();
            }

            if (newValue instanceof Model) {
                if (newValue !== rawValue) {
                    proxy = createModelProxy(newValue, track, trigger) as T;
                }

                value = proxy as T;
            } else {
                value = newValue;
                proxy = null;
            }

            rawValue = newValue;

            trigger();

            if (!isInstanceOf(rawValue, Model) || listeners.length) {
                return;
            }

            for (const modelClass of getRelatedClasses(rawValue.static())) {
                listeners.push(modelClass.on('modified', onModelUpdated));
                listeners.push(modelClass.on('created', onModelUpdated));
                listeners.push(modelClass.on('updated', onModelUpdated));
                listeners.push(modelClass.on('deleted', onModelUpdated));
                listeners.push(modelClass.on('relation-loaded', onModelUpdated));
            }
        });

        return {
            get: () => tap(value, () => track()),

            // oxlint-disable-next-line no-console
            set: () => console.warn('Computed model ref was not set (it is immutable).'),
        };
    });
}

export function computedModels<T>(
    modelClass: ModelConstructor,
    compute: () => T,
    options: ComputedModelsOptions = {},
): ComputedRef<T> {
    // TODO This implementation is probably very inefficient and needs to be improved for better performance with large
    // collections. There are also more details in the unit tests for this function.
    return reactiveComputedModels(modelClass, compute, options);
}

export function computedModelAttribute<TModel extends Model, TAttribute extends string & keyof TModel>(
    model: MaybeRefOrGetter<TModel | null | undefined>,
    attribute: TAttribute,
): TModel[TAttribute] extends ComputedAttribute<infer T> ? Readonly<Ref<T | undefined>> : never {
    return customRef((track, trigger) => {
        let computedAttribute: Nullable<ComputedAttribute>;
        let unsubscribe: Nullable<() => void>;

        watchEffect(() => {
            const currentModel = toValue(model);
            const currentComputedAttribute = currentModel && toRaw(currentModel).getComputedAttribute(attribute);

            if (currentComputedAttribute === computedAttribute) {
                return;
            }

            unsubscribe?.();

            computedAttribute = currentComputedAttribute;
            unsubscribe = computedAttribute?.subscribe(() => trigger());
        });

        onScopeDispose(() => unsubscribe?.());

        return {
            get: () => {
                track();

                return computedAttribute?.value;
            },
            set: () => fail('Pending episode dates are read-only'),
        };
    }) as TModel[TAttribute] extends ComputedAttribute<infer T> ? Readonly<Ref<T | undefined>> : never;
}

export function useModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean; depth?: number } = {},
): UseModelsResult<T> {
    const models = shallowRef([]) as Ref<T[]>;
    const modelData = _getTrackedModelsData<T>(modelClass, { load: true, depth: options.depth });

    watchEffect(() => (models.value = modelData.modelsArray.value));
    onCleanMounted(() => modelClass.on('updated', () => (models.value = models.value.slice(0))));

    return {
        models: computed(() => {
            if (options.includeSoftDeleted) {
                return models.value;
            }

            return models.value.filter((model) => !isSoftDeleted(model));
        }),
        loading: computed(() => modelData.loading.value && !modelData.loaded.value),
        refreshing: readonly(modelData.loading),
    };
}

export function useModelEvent<TModel extends Model, TEvent extends keyof ModelEvents>(
    modelClass: ModelConstructor<TModel>,
    event: TEvent,
    listener: ModelListener<TModel, TEvent>,
): void {
    const cleanUp = modelClass.on(event, listener);

    getCurrentScope() && onScopeDispose(cleanUp);
}
