import { IndexedDBEngine, bootModelsFromViteGlob, setEngine } from 'soukai';

import { defineBootstrapHook } from '@/bootstrap/hooks';

export default defineBootstrapHook(async (_, options) => {
    if (!options.models) {
        return;
    }

    setEngine(new IndexedDBEngine());
    bootModelsFromViteGlob(options.models);
});

declare module '@/bootstrap/options' {
    interface BootstrapOptions {
        models?: Record<string, Record<string, unknown>>;
    }
}
