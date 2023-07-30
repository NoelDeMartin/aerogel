import { arrayRemove } from '@noeldemartin/utils';
import { onCleanMounted } from '@aerogel/core';
import { onMounted, ref } from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { Ref } from 'vue';

export function useModelCollection<T extends Model>(model: ModelConstructor<T>): Ref<T[]> {
    const models = ref<T[]>([]) as Ref<T[]>;

    onCleanMounted(() => model.on('deleted', (model) => arrayRemove(models.value, model)));
    onCleanMounted(() => model.on('created', (model) => models.value.push(model)));
    onMounted(async () => {
        const databaseModels = await model.all();

        models.value.push(...databaseModels);
    });

    return models;
}
