import 'fake-indexeddb/auto';

import { installVitestSolidMatchers } from '@noeldemartin/solid-utils/vitest';
import { FakeLocalStorage, FakeServer, mock, setupFacadeMocks } from '@noeldemartin/testing';
import { noop, resetAsyncMemo } from '@noeldemartin/utils';
import { beforeEach, vi } from 'vitest';
import { defineDocumentsCacheMock } from '@aerogel/plugin-local-first/testing/mocks/documents-cache';
import type { DocumentsCache } from 'soukai-solid';

setupFacadeMocks();
installVitestSolidMatchers();
globalThis.location = mock<Location>({ href: 'https://example.com' });

beforeEach(async () => {
    const { Solid } = await import('@aerogel/plugin-solid');
    const { default: SolidMock } = await import('./mocks/Solid.mock');
    const { resetPiniaStore } = await import('@aerogel/core');
    const { resetTrackedModels } = await import('@aerogel/plugin-soukai');

    FakeLocalStorage.requireInstance().clear();
    Solid.setMockFacade(SolidMock);
    FakeServer.reset();

    resetAsyncMemo();
    resetPiniaStore();
    resetTrackedModels();
});

vi.stubGlobal('addEventListener', noop);

vi.mock('@aerogel/core', async () => {
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.patchGlobal();

    return original;
});

vi.mock('soukai-solid', async () => {
    const original = (await vi.importActual('soukai-solid')) as { DocumentsCache: typeof DocumentsCache };

    return {
        ...original,

        // This is necessary because otherwise tests fail when trying to resolve idb instance,
        // maybe it's caused by a bug between idb and fake-indexeddb.
        DocumentsCache: defineDocumentsCacheMock(original.DocumentsCache),
    };
});
