import 'fake-indexeddb/auto';

import { beforeEach, expect, vi } from 'vitest';
import { mock, resetAsyncMemo, setTestingNamespace, tap } from '@noeldemartin/utils';

import { sparqlEquals } from '@noeldemartin/solid-utils';

setTestingNamespace(vi);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap(globalThis, (global: any) => {
    global.jest = vi;
    global.navigator = { languages: ['en'] };
    global.localStorage = mock<Storage>({
        getItem: () => null,
        setItem: () => null,
    });
});

beforeEach(async () => {
    const { resetPiniaStore } = await import('@aerogel/core');
    const { resetTrackedModels } = await import('@aerogel/plugin-soukai');
    const { Solid } = await import('@aerogel/plugin-solid');
    const { default: SolidMock } = await import('./mocks/Solid.mock');

    Solid.setMockFacade(SolidMock);

    resetAsyncMemo();
    resetPiniaStore();
    resetTrackedModels();
});

expect.extend({
    toEqualSparql(received, expected) {
        const { isNot } = this;
        const result = sparqlEquals(expected, received);

        return {
            pass: result.success,
            message: () => `Sparql ${isNot ? 'does not match' : 'matches'}: ${result.message}`,
        };
    },
});
