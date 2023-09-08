import { IndexedDBEngine, bootModelsFromViteGlob, setEngine } from 'soukai';

import type { Plugin } from '@aerogel/core';

export * from './utils';

export interface Options {
    models: Record<string, Record<string, unknown>>;
}

export default function soukai(options: Options): Plugin {
    return {
        install() {
            setEngine(new IndexedDBEngine());
            bootModelsFromViteGlob(options.models);
        },
    };
}
