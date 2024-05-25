import { arrayRemove, tap } from '@noeldemartin/utils';
import { onCleanMounted } from '@aerogel/core';
import { customRef, getCurrentScope, onMounted, onScopeDispose, ref, watchEffect } from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { ComputedRef, Ref } from 'vue';

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
