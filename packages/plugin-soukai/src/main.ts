import { IndexedDBEngine, bootModelsFromViteGlob, setEngine } from 'soukai';

import type { Plugin } from '@aerogel/core';

import { testingRuntime } from './testing';

export * from './testing';
export * from './utils';

function setupTestingRuntime(): void {
    if (!globalThis.testingRuntime) {
        return;
    }

    Object.assign(globalThis.testingRuntime, testingRuntime);
}

export interface Options {
    models: Record<string, Record<string, unknown>>;
}

export default function soukai(options: Options): Plugin {
    return {
        install() {
            setupTestingRuntime();
            setEngine(new IndexedDBEngine());
            bootModelsFromViteGlob(options.models);
        },
    };
}
