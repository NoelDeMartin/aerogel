import 'soukai-bis/patch-zod';
import { RELATIONS_LOAD_BATCH_SIZE } from '@aerogel/plugin-solid/utils/constants';
import { setupSoukai } from '@aerogel/plugin-solid/utils/soukai';
import type { ModelsWorkerRequest, ModelsWorkerResponse } from '@aerogel/plugin-solid/workers/ModelsWorker';
import type { SolidDocument } from '@noeldemartin/solid-utils';
import { arrayChunk, arrayUnique, isInstanceOf, urlRoute } from '@noeldemartin/utils';
import { DocumentNotFound, buildModelsCache, requireBootedModel } from 'soukai-bis';
import type { IndexedDBEngine, Model, SerializedModel } from 'soukai-bis';

let engine: IndexedDBEngine | null = null;

function requireEngine(): IndexedDBEngine {
    if (!engine) {
        throw new Error('Models worker has not been booted');
    }

    return engine;
}

async function loadModelRelations(model: Model, document: SolidDocument, relations: string[]): Promise<void> {
    const quads = document.getQuads();
    const modelsCache = buildModelsCache(model.getDocumentModels());

    for (const name of relations) {
        const relation = model.getRelation(name);

        if (relation.loaded) {
            continue;
        }

        if (relation.usingSameDocument) {
            await relation.loadFromDocumentRDF(quads, { modelsCache });
        }

        relation.loaded || (await relation.load());
    }
}

const methods = {
    async boot(namespace: string): Promise<void> {
        const { default: models } = await import('virtual:aerogel-models');

        engine = setupSoukai({ namespace, models });
    },

    async *loadModels(modelName: string, containerUrl: string, depth?: number): AsyncGenerator<SerializedModel[]> {
        const modelClass = requireBootedModel(modelName);
        const documentsBatches = requireEngine().readDocumentsInBatches(containerUrl, { depth });

        try {
            for await (const documents of documentsBatches) {
                const models = await Promise.all(
                    Object.values(documents).map((document) => modelClass.createManyFromDocument(document)),
                );

                yield models.flat().map((model) => model.serialize());
            }
        } catch (error) {
            if (!isInstanceOf(error, DocumentNotFound)) {
                throw error;
            }
        }
    },

    async *loadRelations(
        modelName: string,
        urls: string[],
        relations: string[],
    ): AsyncGenerator<Record<string, SerializedModel>> {
        const modelClass = requireBootedModel(modelName);

        for (const batchUrls of arrayChunk(urls, RELATIONS_LOAD_BATCH_SIZE)) {
            const documents = await requireEngine().readDocuments({ urls: arrayUnique(batchUrls.map(urlRoute)) });
            const serializedModels: Record<string, SerializedModel> = {};

            for (const url of batchUrls) {
                const document = documents[urlRoute(url)];
                const model = document && (await modelClass.createFromDocument(document, { url }));

                if (!document || !model) {
                    continue;
                }

                await loadModelRelations(model, document, relations);

                serializedModels[url] = model.serialize({ relations });
            }

            yield serializedModels;
        }
    },
};

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
    return typeof value === 'object' && value !== null && Symbol.asyncIterator in value;
}

function respond(response: ModelsWorkerResponse): void {
    postMessage(response);
}

export type ModelsWorkerMethods = typeof methods;

addEventListener('message', async ({ data: { id, method, args } }: MessageEvent<ModelsWorkerRequest>) => {
    try {
        const result = (methods[method] as (...methodArgs: unknown[]) => unknown)(...args);

        if (!isAsyncIterable(result)) {
            respond({ id, type: 'done', value: await result });

            return;
        }

        for await (const chunk of result) {
            respond({ id, type: 'chunk', value: chunk });
        }

        respond({ id, type: 'done' });
    } catch (error) {
        respond({ id, type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
});
