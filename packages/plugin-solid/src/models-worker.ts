import 'soukai-bis/patch-zod';
import { setupSoukai } from '@aerogel/plugin-solid/utils/soukai';
import type { ModelsWorkerRequest, ModelsWorkerResponse } from '@aerogel/plugin-solid/workers/ModelsWorker';
import { isInstanceOf } from '@noeldemartin/utils';
import { DocumentNotFound, requireBootedModel } from 'soukai-bis';
import type { IndexedDBEngine, SerializedModel } from 'soukai-bis';

let engine: IndexedDBEngine | null = null;

const methods = {
    async boot(namespace: string): Promise<void> {
        const { default: models } = await import('virtual:aerogel-models');

        engine = setupSoukai({ namespace, models });
    },

    async *loadModels(modelName: string, containerUrl: string, depth?: number): AsyncGenerator<SerializedModel[]> {
        if (!engine) {
            throw new Error('Models worker has not been booted');
        }

        const modelClass = requireBootedModel(modelName);
        const documentsBatches = engine.readDocumentsInBatches(containerUrl, { depth });

        try {
            for await (const documents of documentsBatches) {
                const models = await Promise.all(
                    Object.values(documents).map((document) => modelClass.createManyFromDocument(document)),
                ).then((documentModels) => documentModels.flat());

                await Promise.all(models.map((model) => model.loadComputedAttributes()));

                yield models.map((model) => model.serialize());
            }
        } catch (error) {
            if (!isInstanceOf(error, DocumentNotFound)) {
                throw error;
            }
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
