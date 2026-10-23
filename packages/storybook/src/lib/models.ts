import { getTrackedModels, loadTrackedModels } from '@aerogel/plugin-solid';
import type { JsonLDGraph } from '@noeldemartin/solid-utils';
import { arrayGroupBy, urlRoute } from '@noeldemartin/utils';
import { requireEngine } from 'soukai-bis';
import type { Model, ModelConstructor } from 'soukai-bis';

export interface SeedModelsOptions {
    documents?: JsonLDGraph[];
    setup?(): unknown;
}

export async function seedModels<T extends Model>(
    modelClass: ModelConstructor<T>,
    options: SeedModelsOptions = {},
): Promise<T[]> {
    const engine = requireEngine();
    const documents = arrayGroupBy(
        (options.documents ?? []).flatMap((graph) => graph['@graph']),
        (resource) => urlRoute(resource['@id']),
    );

    for (const [documentUrl, resources] of Object.entries(documents)) {
        await engine.createDocument(documentUrl, { '@graph': resources });
    }

    await options.setup?.();
    await loadTrackedModels(modelClass);

    return getTrackedModels(modelClass);
}
