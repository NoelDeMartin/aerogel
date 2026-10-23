import { seedModels, type SeedModelsOptions } from '@aerogel/storybook/lib/models';
import type { Model, ModelConstructor } from 'soukai-bis';
import { onMounted, shallowRef, type Ref } from 'vue';

export function useSeededModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: SeedModelsOptions = {},
): Readonly<Ref<T[] | null>> {
    const models = shallowRef<T[] | null>(null);

    onMounted(async () => (models.value = await seedModels(modelClass, options)));

    return models;
}
