import { arrayRemove, isArray, isObject, tap } from '@noeldemartin/utils';
import { onCleanMounted } from '@aerogel/core';
import {
    computed,
    customRef,
    getCurrentScope,
    onMounted,
    onScopeDispose,
    onUnmounted,
    reactive,
    ref,
    watchEffect,
} from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { ComputedRef, Ref } from 'vue';

function isSoftDeleted(model: Model): boolean {
    if (!('isSoftDeleted' in model)) {
        return false;
    }

    return (model as { isSoftDeleted(): boolean }).isSoftDeleted();
}

function mapModels<T extends Model>(
    models: unknown,
    existingMap?: Map<string, T>,
    deep: boolean = true,
): Map<string, T> {
    const map = existingMap ?? new Map();

    if (isArray(models)) {
        models.forEach((model) => map.set(model.id, model));

        return map;
    }

    if (isObject(models)) {
        if (deep) {
            Object.values(models).forEach((value) => mapModels(value, map, false));

            return map;
        }

        map.set(models.id as string, models as T);

        return map;
    }

    return map;
}

function shallowComputedModels<T>(modelClass: typeof Model, compute: () => T): ComputedRef<T> {
    return customRef((track, trigger) => {
        let value: T;
        const recompute = () => ((value = compute()), trigger());
        const modelListeners: Array<() => void> = [
            modelClass.on('deleted', recompute),
            modelClass.on('created', recompute),
            modelClass.on('updated', recompute),
            modelClass.on('modified', recompute),
            modelClass.on('relation-loaded', recompute),
        ];
        const stopModelListeners = () => {
            modelListeners.forEach((stop) => stop());
            modelListeners.splice(0, modelListeners.length);
        };

        getCurrentScope() && onScopeDispose(stopModelListeners);
        watchEffect(recompute);

        return {
            get: () => tap(value, () => track()),

            // eslint-disable-next-line no-console
            set: () => console.warn('Computed models ref was not set (it is immutable).'),
        };
    }) as ComputedRef<T>;
}

function reactiveComputedModels<T>(modelClass: typeof Model, compute: () => T): ComputedRef<T> {
    const shallowModels = shallowComputedModels(modelClass, compute);
    const reactiveModels = computed(() => {
        if (isArray(shallowModels.value)) {
            return shallowModels.value
                .filter((shadowModel) => !isSoftDeleted(shadowModel))
                .map((shallowModel) => reactive(shallowModel)) as T;
        }

        if (isObject(shallowModels.value)) {
            return Object.entries(shallowModels.value).reduce((models, [name, value]) => {
                if (isArray(value)) {
                    models[name as keyof T] = value
                        .filter((shadowModel) => !isSoftDeleted(shadowModel))
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
        Object.assign(reactiveModelsMap.value.get(updatedModel.id) ?? {}, {
            [field]: updatedModel.getAttribute(field),
        });
    });

    onUnmounted(stop);

    return reactiveModels;
}

export type RefValue<T> = T extends Ref<infer TValue> ? TValue : never;

export function computedModel<T extends Model | null | undefined>(compute: () => T): Readonly<Ref<T>> {
    return customRef((track, trigger) => {
        let value: T;
        const modelListeners: Array<() => void> = [];
        const onModelUpdated = (model: Model) => model.id === value?.id && trigger();
        const stopModelListeners = () => {
            modelListeners.forEach((stop) => stop());
            modelListeners.splice(0, modelListeners.length);
        };

        getCurrentScope() && onScopeDispose(stopModelListeners);
        watchEffect(() => {
            const newValue = compute();

            if (newValue?.static() !== value?.static()) {
                stopModelListeners();
            }

            value = newValue;
            trigger();

            if (value && !modelListeners.length) {
                modelListeners.push(value.static().on('modified', onModelUpdated));
                modelListeners.push(value.static().on('updated', onModelUpdated));
                modelListeners.push(value.static().on('relation-loaded', onModelUpdated));
            }
        });

        return {
            get: () => tap(value, () => track()),

            // eslint-disable-next-line no-console
            set: () => console.warn('Computed model ref was not set (it is immutable).'),
        };
    });
}

export function computedModels<T>(modelClass: typeof Model, compute: () => T): ComputedRef<T> {
    // TODO This implementation is probably very inefficient and needs to be improved for better performance with large
    // collections. There are also more details in the unit tests for this function.
    return reactiveComputedModels(modelClass, compute);
}

export function useModelCollection<T extends Model>(modelClass: ModelConstructor<T>): Ref<T[]> {
    const models = ref<T[]>([]) as Ref<T[]>;

    onCleanMounted(() => modelClass.on('deleted', (model) => arrayRemove(models.value, model)));
    onCleanMounted(() => modelClass.on('created', (model) => models.value.push(model)));
    onCleanMounted(() => modelClass.on('updated', () => (models.value = models.value.slice(0))));
    onMounted(async () => {
        const databaseModels = await modelClass.all();

        models.value.push(...databaseModels);
    });

    return models;
}
