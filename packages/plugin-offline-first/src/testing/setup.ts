import { beforeEach, expect, vi } from 'vitest';
import { mock, resetAsyncMemo, setTestingNamespace, tap } from '@noeldemartin/utils';
import { resetPiniaStore } from '@aerogel/core';
import { resetTrackedModels } from '@aerogel/plugin-soukai';
import { Solid, SolidMock } from '@aerogel/plugin-solid';
import { sparqlEquals } from '@noeldemartin/solid-utils';

setTestingNamespace(vi);
Solid.setMockFacade(SolidMock);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap(globalThis, (global: any) => {
    global.jest = vi;
    global.localStorage = mock<Storage>({
        getItem: () => null,
        setItem: () => null,
    });
});

beforeEach(() => {
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
