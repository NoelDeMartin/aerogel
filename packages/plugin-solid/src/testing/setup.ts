import 'fake-indexeddb/auto';
import { Cache, Events } from '@aerogel/core';
import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { InMemoryEngine, bootCoreModels, bootModels, resetModelListeners, setEngine } from 'soukai-bis';
import { beforeEach, vi } from 'vite-plus/test';

vi.mock('@aerogel/core', async () => {
    const { FakeLocalStorage } = await import('@noeldemartin/testing');
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();

    return original;
});

beforeEach(async () => {
    await Cache.clear();

    Events.reset();
    resetModelListeners();
    bootCoreModels({ reset: true });
    bootModels({ User }, { reset: true });
    setEngine(new InMemoryEngine());
});
