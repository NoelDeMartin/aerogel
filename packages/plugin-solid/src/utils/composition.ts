import { Cache, Errors, Events, onCleanMounted } from '@aerogel/core';
import { debounce, fail, isArray, isInstanceOf, isNullable, isPlainObject, tap, throttle } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { Model, getRelatedClasses, hydrateModel } from 'soukai-bis';
import type {
    ComputedAttribute,
    ModelConstructor,
    ModelEvents,
    ModelListener,
    ModelWithUrl,
    SerializedModel,
} from 'soukai-bis';
import {
    ReactiveEffect,
    computed,
    customRef,
    getCurrentScope,
    onScopeDispose,
    readonly,
    shallowReactive,
    shallowRef,
    toRaw,
    toValue,
    watch,
    watchEffect,
} from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

import { IS_REACTIVE, RAW } from './flags';
import { _getTrackedModelsData, isSoftDeleted } from './internal';

const SERIALIZED_MODEL_KEY = '@model';

function isSerializedModelReference(value: unknown): value is { [SERIALIZED_MODEL_KEY]: SerializedModel } {
    return isPlainObject(value) && SERIALIZED_MODEL_KEY in value;
}

function isModel(value: unknown): value is Model {
    return isInstanceOf(value, Model);
}

function mapNestedValues<TLeaf>(
    value: unknown,
    isLeaf: (value: unknown) => value is TLeaf,
    callback: (leaf: TLeaf) => unknown,
    filter: (leaf: TLeaf) => boolean = () => true,
): unknown {
    const isIncluded = (item: unknown) => !isLeaf(item) || filter(item);
    const mapItem = (item: unknown) => mapNestedValues(item, isLeaf, callback, filter);

    if (isLeaf(value)) {
        return callback(value);
    }

    if (isArray(value)) {
        return value.filter(isIncluded).map(mapItem);
    }

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, item]) => isIncluded(item))
                .map(([key, item]) => [key, mapItem(item)]),
        );
    }

    return value;
}

function mapModels(value: unknown): Map<string, Model> {
    const map = new Map<string, Model>();

    mapNestedValues(value, isModel, (model) => model.url && map.set(model.url, model));

    return map;
}

function watchComputedAttributes(modelClass: ModelConstructor, attributes: string[], callback: () => void) {
    const modelAttributes = attributes.filter((attribute) => attribute in modelClass.schema.computed);

    if (modelAttributes.length === 0) {
        return;
    }

    const modelData = _getTrackedModelsData(modelClass);
    const subscriptions = new Map<Model, () => void>();

    watchEffect(() => {
        const watchedModels = new Set<Model>(modelData.modelsArray.value);

        for (const [model, unsubscribe] of subscriptions.entries()) {
            if (watchedModels.has(model)) {
                continue;
            }

            unsubscribe();
            subscriptions.delete(model);
        }

        modelData.modelsArray.value.forEach((model) => {
            if (subscriptions.has(model)) {
                return;
            }

            const unsubscribes = modelAttributes.map((attribute) => {
                const computedAttribute = toRaw(model).getComputedAttribute(attribute);

                return computedAttribute.subscribe(callback);
            });

            subscriptions.set(model, () => unsubscribes.forEach((unsubscribe) => unsubscribe()));
        });
    });

    getCurrentScope() && onScopeDispose(() => subscriptions.forEach((unsubscribe) => unsubscribe()));
}

function shallowComputedModels<T>(
    modelClasses: ModelConstructor[],
    compute: () => T,
    options: ComputedModelsOptions = {},
): ComputedRef<T> {
    const watchedAttributes = options.watch ?? [];
    const unknownAttribute = watchedAttributes.find(
        (attribute) => !modelClasses.some((modelClass) => attribute in modelClass.schema.computed),
    );

    if (unknownAttribute) {
        throw new Error(`Computed attribute '${unknownAttribute}' is not defined in any of the watched models.`);
    }

    return customRef((track, trigger) => {
        let value: T;
        let dirty = true;
        const invalidate = () => dirty || ((dirty = true), trigger());
        const invalidateComputedAttributes = throttle(invalidate);
        const computeEffect = new ReactiveEffect(compute);
        const listeners: Array<() => void> = modelClasses.flatMap((modelClass) => [
            modelClass.on('deleted', invalidate),
            modelClass.on('created', invalidate),
            modelClass.on('updated', invalidate),
            modelClass.on('modified', invalidate),
            modelClass.on('relation-loaded', invalidate),
        ]);

        computeEffect.scheduler = invalidate;

        modelClasses.forEach((modelClass) =>
            watchComputedAttributes(modelClass, watchedAttributes, invalidateComputedAttributes),
        );
        getCurrentScope() && onScopeDispose(() => listeners.forEach((stop) => stop()));

        return {
            get: () => {
                if (dirty) {
                    value = computeEffect.run();
                    dirty = false;
                }

                track();

                return value;
            },

            // oxlint-disable-next-line no-console
            set: () => console.warn('Computed models ref was not set (it is immutable).'),
        };
    }) as ComputedRef<T>;
}

function reactiveComputedModels<T>(
    modelClasses: ModelConstructor[],
    compute: () => T,
    options: ComputedModelsOptions = {},
): ComputedRef<T> {
    let reactiveModelsMap = new Map<string, Model>();
    const cachedValue = shallowRef<{ value: T } | null>(null);
    const shallowModels = shallowComputedModels(modelClasses, compute, options);
    const reactiveModels = computed(() => {
        const value = shallowModels.value;

        return tap(
            toReactiveModels(isNullable(value) && cachedValue.value ? cachedValue.value.value : value),
            (models) => (reactiveModelsMap = mapModels(models)),
        );
    });

    const listeners = modelClasses.map((modelClass) =>
        modelClass.on('modified', (updatedModel, field) => {
            if (!updatedModel.url) {
                return;
            }

            Object.assign(reactiveModelsMap.get(updatedModel.url) ?? {}, {
                [field]: updatedModel.getAttribute(field),
            });
        }),
    );

    getCurrentScope() && onScopeDispose(() => listeners.forEach((stop) => stop()));

    if (options.cache) {
        void restoreCachedValue<T>(options.cache).then((value) => value && (cachedValue.value ??= value));

        watchCachedValue(options.cache, reactiveModels, shallowModels, cachedValue);
    }

    return reactiveModels;
}

async function restoreCachedValue<T>(key: string): Promise<{ value: T } | null> {
    try {
        const cached = await Cache.get(key);

        if (cached === undefined) {
            return null;
        }

        return { value: (await hydrateCachedValue(cached)) as T };
    } catch (error) {
        Errors.reportDevelopmentError(error, `Failed restoring cached value '${key}'`);

        return null;
    }
}

async function hydrateCachedModel(serializedModel: SerializedModel): Promise<Model> {
    const model = await hydrateModel(serializedModel);

    if (!model.hasUrl()) {
        return model;
    }

    const trackedModelsData = _getTrackedModelsData(model.static());
    const trackedModel = trackedModelsData.modelsSet.values().find(({ url }) => url === model.url);

    if (trackedModel) {
        return trackedModel;
    }

    if (!trackedModelsData.loaded.value) {
        trackedModelsData.modelsSet.add(model);
    }

    return model;
}

async function hydrateCachedValue(value: unknown): Promise<unknown> {
    const hydratingModels: Promise<[object, Model]>[] = [];

    mapNestedValues(value, isSerializedModelReference, (reference) =>
        hydratingModels.push(hydrateCachedModel(reference[SERIALIZED_MODEL_KEY]).then((model) => [reference, model])),
    );

    const models = new Map(await Promise.all(hydratingModels));

    return mapNestedValues(value, isSerializedModelReference, (reference) => models.get(reference));
}

function serializeCachedValue(value: unknown): unknown {
    return mapNestedValues(value, isModel, (model) => ({ [SERIALIZED_MODEL_KEY]: toRaw(model).serialize() }));
}

function watchCachedValue(
    key: string,
    reactiveModels: ComputedRef<unknown>,
    shallowModels: ComputedRef<unknown>,
    cachedValue: Ref<{ value: unknown } | null>,
): void {
    const stopListeners = Events.on('purge-storage', () => {
        saveValue.cancel();

        cachedValue.value = null;
    });
    const saveValue = debounce(async (value: unknown) => {
        try {
            await Cache.set(key, serializeCachedValue(value));
        } catch (error) {
            Errors.reportDevelopmentError(error, `Failed caching value '${key}'`);
        }
    }, 500);

    watch(reactiveModels, (value) => {
        if (isNullable(shallowModels.value)) {
            return;
        }

        cachedValue.value = { value };

        saveValue(value);
    });

    getCurrentScope() && onScopeDispose(stopListeners);
}

function toReactiveModels<T>(value: T): T {
    return mapNestedValues(value, isModel, shallowReactive, (model) => !isSoftDeleted(model)) as T;
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

export type ComputedAttributeName<T extends ModelConstructor> = T extends ModelConstructor
    ? string extends keyof T['computed']
        ? never
        : string & keyof T['computed']
    : never;

export interface ComputedModelsOptions<TAttribute extends string = string> {
    watch?: TAttribute[];
    cache?: string;
}

export interface UseModelsResult<T extends Model> {
    models: ComputedRef<ModelWithUrl<T>[]>;
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

export function computedModels<T, TModelClass extends ModelConstructor = ModelConstructor>(
    modelClasses: TModelClass | TModelClass[],
    compute: () => T,
    options: ComputedModelsOptions<
        ModelConstructor extends TModelClass ? string : ComputedAttributeName<TModelClass>
    > = {},
): ComputedRef<T> {
    // TODO This implementation is probably very inefficient and needs to be improved for better performance with large
    // collections. There are also more details in the unit tests for this function.
    return reactiveComputedModels(isArray(modelClasses) ? modelClasses : [modelClasses], compute, options);
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
    const models = shallowRef([]) as Ref<ModelWithUrl<T>[]>;
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
