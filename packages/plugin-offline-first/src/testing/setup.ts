import 'fake-indexeddb/auto';

import { installVitestSolidMatchers } from '@noeldemartin/solid-utils/testing';
import { FakeLocalStorage, FakeServer, setupFacadeMocks } from '@noeldemartin/testing';
import { resetAsyncMemo } from '@noeldemartin/utils';
import { beforeEach, vi } from 'vitest';

setupFacadeMocks();
installVitestSolidMatchers();

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

vi.mock('@aerogel/core', async () => {
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.patchGlobal();

    return original;
});
