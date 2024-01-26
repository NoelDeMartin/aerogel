import { arrayRemove } from '@noeldemartin/utils';
import { onCleanMounted } from '@aerogel/core';
import { onMounted, ref } from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { Ref } from 'vue';

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
