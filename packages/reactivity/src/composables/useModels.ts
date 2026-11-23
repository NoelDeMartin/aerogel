import { computedModels } from '@aerogel/reactivity/composables/computedModels';
import { config } from '@aerogel/reactivity/internals/config';
import { getTrackedModelsData } from '@aerogel/reactivity/internals/tracking';
import type { Model, ModelConstructor, ModelWithUrl } from 'soukai-bis';
import { computed, readonly, ref, shallowRef, toValue, watch, watchEffect } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

export interface UseModelsResult<T extends Model> {
    models: ComputedRef<ModelWithUrl<T>[]>;
    loading: ComputedRef<boolean>;
    refreshing: Readonly<Ref<boolean>>;
}

export function useModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean; depth?: number; only?: MaybeRefOrGetter<string[]> } = {},
): UseModelsResult<T> {
    let lastLoadId = 0;
    const hasUrls = options.only !== undefined;
    const urlsLoading = ref(false);
    const models = shallowRef([]) as Ref<ModelWithUrl<T>[]>;
    const modelData = getTrackedModelsData<T>(modelClass, { load: !hasUrls, depth: options.depth });

    watch(
        () => toValue(options.only),
        (urls) => {
            if (!urls) {
                return;
            }

            const loadId = ++lastLoadId;

            if (urls.length === 0) {
                urlsLoading.value = false;

                return;
            }

            urlsLoading.value = true;

            modelData
                .load(urls)
                .catch((error) => config.reportError(error))
                .finally(() => {
                    if (loadId !== lastLoadId) {
                        return;
                    }

                    urlsLoading.value = false;
                });
        },
        { immediate: true, deep: true, flush: 'sync' },
    );

    watchEffect(() => {
        if (!hasUrls) {
            models.value = modelData.modelsArray.value;

            return;
        }

        const urlsSet = new Set(toValue(options.only));

        models.value = modelData.modelsArray.value.filter((model) => urlsSet.has(model.url));
    });

    return {
        models: computedModels(modelClass, () => models.value, { includeSoftDeleted: options.includeSoftDeleted }),
        loading: hasUrls
            ? computed(() => urlsLoading.value)
            : computed(() => modelData.loading.value && !modelData.loaded.value),
        refreshing: hasUrls
            ? computed(() => urlsLoading.value || modelData.loading.value)
            : readonly(modelData.loading),
    };
}
