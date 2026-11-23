import { computedModel } from '@aerogel/reactivity/composables/computedModel';
import { useModels } from '@aerogel/reactivity/composables/useModels';
import type { Model, ModelConstructor, ModelWithUrl } from 'soukai-bis';
import type { ComputedRef, Ref } from 'vue';

export interface UseSingletonModelResult<T extends Model> {
    model: Readonly<Ref<ModelWithUrl<T> | null>>;
    loading: ComputedRef<boolean>;
    refreshing: Readonly<Ref<boolean>>;
}

export function useSingletonModel<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: { includeSoftDeleted?: boolean } = {},
): UseSingletonModelResult<T> {
    const { models, loading, refreshing } = useModels(modelClass, options);

    return {
        model: computedModel(() => models.value[0] ?? null),
        loading,
        refreshing,
    };
}
