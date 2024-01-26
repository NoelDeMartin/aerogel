import { arrayWithout } from '@noeldemartin/utils';
import type { Model, ModelConstructor } from 'soukai';
import type { Service } from '@aerogel/core';

export type ModelService<TModel extends Model, TKey extends string> = Service<{ [K in TKey]: TModel[] }>;

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
