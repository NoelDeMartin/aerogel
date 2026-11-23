import { config } from '@aerogel/reactivity/internals/config';
import { reportDevelopmentError } from '@aerogel/reactivity/internals/errors';
import {
    getTrackedModelsData,
    listenToModelChanges,
    onTrackedModelsCleared,
} from '@aerogel/reactivity/internals/tracking';
import type { ComputedModelsCache } from '@aerogel/reactivity/lib/config';
import { debounce, fail, isArray, isInstanceOf, isNullable, isPlainObject, tap, throttle } from '@noeldemartin/utils';
import { Model, hydrateModel } from 'soukai-bis';
import type { ComputedAttribute, ModelConstructor, SerializedModel } from 'soukai-bis';
import {
    ReactiveEffect,
    computed,
    customRef,
    getCurrentScope,
    onScopeDispose,
    shallowReactive,
    shallowRef,
    toRaw,
    watch,
    watchEffect,
} from 'vue';
import type { ComputedRef, Ref } from 'vue';

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
    const modelAttributes = attributes.filter((attribute) => modelClass.hasComputedAttribute(attribute));

    if (modelAttributes.length === 0) {
        return;
    }

    const modelData = getTrackedModelsData(modelClass);
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
    const watchedAttributes = options.watchComputedAttributes ?? [];
    const unknownAttribute = watchedAttributes.find(
        (attribute) => !modelClasses.some((modelClass) => modelClass.hasComputedAttribute(attribute)),
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
        const listeners: Array<() => void> = modelClasses.flatMap((modelClass) =>
            listenToModelChanges(modelClass, invalidate),
        );

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
            toReactiveModels(isNullable(value) && cachedValue.value ? cachedValue.value.value : value, options),
            (models) => (reactiveModelsMap = mapModels(models)),
        );
    });

    const listeners = modelClasses.map((modelClass) =>
        modelClass.on('modified', ({ model: updatedModel, field }) => {
            if (!updatedModel.url) {
                return;
            }

            Object.assign(reactiveModelsMap.get(updatedModel.url) ?? {}, {
                [field]: updatedModel.getAttribute(field),
            });
        }),
    );

    getCurrentScope() && onScopeDispose(() => listeners.forEach((stop) => stop()));

    if (options.cacheKey) {
        const cache = config.computedModelsCache ?? fail<ComputedModelsCache>('Computed models cache is missing');

        void restoreCachedValue<T>(cache, options.cacheKey).then((value) => value && (cachedValue.value ??= value));

        watchCachedValue(cache, options.cacheKey, reactiveModels, shallowModels, cachedValue);
    }

    return reactiveModels;
}

async function restoreCachedValue<T>(cache: ComputedModelsCache, key: string): Promise<{ value: T } | null> {
    try {
        const cached = await cache.get(key);

        if (cached === undefined) {
            return null;
        }

        return { value: (await hydrateCachedValue(cached)) as T };
    } catch (error) {
        reportDevelopmentError(error, `Failed restoring cached value '${key}'`);

        return null;
    }
}

async function hydrateCachedModel(serializedModel: SerializedModel): Promise<Model> {
    const model = await hydrateModel(serializedModel);

    if (!model.hasUrl()) {
        return model;
    }

    const trackedModelsData = getTrackedModelsData(model.static());
    const trackedModel = trackedModelsData.modelsMap.get(model.url);

    if (trackedModel) {
        return trackedModel;
    }

    if (!trackedModelsData.loaded.value) {
        trackedModelsData.modelsMap.add(model);
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
    cache: ComputedModelsCache,
    key: string,
    reactiveModels: ComputedRef<unknown>,
    shallowModels: ComputedRef<unknown>,
    cachedValue: Ref<{ value: unknown } | null>,
): void {
    const stopListeners = onTrackedModelsCleared(() => {
        saveValue.cancel();

        cachedValue.value = null;
    });
    const saveValue = debounce(async (value: unknown) => {
        try {
            await cache.set(key, serializeCachedValue(value));
        } catch (error) {
            reportDevelopmentError(error, `Failed caching value '${key}'`);
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

function toReactiveModels<T>(value: T, options: ComputedModelsOptions = {}): T {
    return mapNestedValues(
        value,
        isModel,
        shallowReactive,
        options.includeSoftDeleted ? undefined : (model) => !model.isSoftDeleted(),
    ) as T;
}

export type ComputedAttributeName<T extends ModelConstructor> =
    T extends ModelConstructor<infer TModel>
        ? {
              [K in keyof TModel]: TModel[K] extends ComputedAttribute ? K : never;
          }[keyof TModel] &
              string
        : never;

export interface ComputedModelsOptions<TAttribute extends string = string> {
    watchComputedAttributes?: TAttribute[];
    cacheKey?: string;
    includeSoftDeleted?: boolean;
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
