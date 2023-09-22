import { arrayRemove, arrayWithout } from '@noeldemartin/utils';
import { onCleanMounted } from '@aerogel/core';
import { onMounted, ref } from 'vue';
import type { Model, ModelConstructor } from 'soukai';
import type { Ref } from 'vue';
import type { Service } from '@aerogel/core';

export type ModelService<TModel extends Model, TKey extends string> = Service<{ [K in TKey]: TModel[] }>;

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

export async function trackModelCollection<TModel extends Model, TKey extends string>(
    modelClass: ModelConstructor<TModel>,
    options: {
        service: ModelService<TModel, TKey>;
        property: TKey;
    },
): Promise<void> {
    const { service, property: stateKey } = options;

    modelClass.on('created', (model) => service.setState(stateKey, service.getState(stateKey).concat([model])));
    modelClass.on('deleted', (model) => service.setState(stateKey, arrayWithout(service.getState(stateKey), model)));
    modelClass.on('updated', () => service.setState(stateKey, service.getState(stateKey).slice(0)));

    const models = await modelClass.all();

    service.setState(stateKey, models);
}
