import { arrayWithout } from '@noeldemartin/utils';
import { Events } from '@aerogel/core';
import type { Model, ModelConstructor } from 'soukai';
import type { Service } from '@aerogel/core';

export type ModelService<TModel extends Model, TKey extends string> = Service<{ [K in TKey]: TModel[] }>;

export async function trackModelCollection<TModel extends Model, TKey extends string>(
    modelClass: ModelConstructor<TModel>,
    options: {
        service: ModelService<TModel, TKey>;
        property: TKey;
        transform?: (models: TModel[]) => TModel[];
    },
): Promise<void> {
    const { service, property: stateKey } = options;
    const transform = options.transform ?? ((models) => models);
    const update = (models: TModel[]) => service.setState(stateKey, transform(models));

    modelClass.on('created', (model) => update(service.getState(stateKey).concat([model])));
    modelClass.on('deleted', (model) => update(arrayWithout(service.getState(stateKey), model)));
    modelClass.on('updated', () => update(service.getState(stateKey).slice(0)));
    Events.on('cloud:migrated', async () => update(await modelClass.all()));

    update(await modelClass.all());
}
