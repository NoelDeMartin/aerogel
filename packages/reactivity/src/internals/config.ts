import type { ComputedModelsCache, ModelsWorker } from '@aerogel/reactivity/lib/config';

export const config = {
    reportError(error: unknown): unknown {
        // oxlint-disable-next-line no-console
        console.error(error);

        return;
    },
    computedModelsCache: null as ComputedModelsCache | null,
    createModelsWorker: null as (() => ModelsWorker) | null,
};
