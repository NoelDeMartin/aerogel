import { arrayRemove, tap } from '@noeldemartin/utils';
import { onCleanMounted } from '@aerogel/core';
import { customRef, onMounted, onScopeDispose, ref, watchEffect } from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { ComputedRef, Ref } from 'vue';

export function computedModel<T extends Model | null | undefined>(compute: () => T): ComputedRef<T> {
    return customRef((track, trigger) => {
        let value: T;
        const modelListeners: Array<() => void> = [];
        const onModelUpdated = (model: Model) => model.id === value?.id && trigger();
        const stopModelListeners = () => (
            modelListeners.forEach((stop) => stop()), modelListeners.splice(0, modelListeners.length)
        );

        onScopeDispose(stopModelListeners);
        watchEffect(() => {
            const newValue = compute();

            if (newValue?.static() !== value?.static()) {
                stopModelListeners();
            }

            value = newValue;
            trigger();

            if (value) {
                modelListeners.push(value.static().on('updated', onModelUpdated));
                modelListeners.push(value.static().on('relation-loaded', onModelUpdated));
            }
        });

        return {
            get: () => tap(value, () => track()),
            set: () => console.warn('Computed model ref was not set (they are immutable).'),
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
