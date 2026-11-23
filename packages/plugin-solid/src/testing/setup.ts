import 'fake-indexeddb/auto';
import { Cache, Events, NetworkCache } from '@aerogel/core';
import FakeCacheStorage from '@aerogel/plugin-solid/testing/stubs/FakeCacheStorage';
import Gallery from '@aerogel/plugin-solid/testing/stubs/models/Gallery';
import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import {
    InMemoryEngine,
    bootCoreModels,
    bootModels,
    resetModelListeners,
    setEngine,
    setRemoteEngine,
} from 'soukai-bis';
import { beforeEach, vi } from 'vite-plus/test';

vi.mock('@aerogel/core', async () => {
    const { FakeLocalStorage } = await import('@noeldemartin/testing');
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();

    return original;
});

beforeEach(async () => {
    vi.stubGlobal('caches', new FakeCacheStorage());
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.restoreAllMocks();
    Events.reset();
    resetModelListeners();
    bootCoreModels({ reset: true });
    bootModels({ Gallery, User }, { reset: true });
    setEngine(new InMemoryEngine());
    setRemoteEngine(null);

    await Cache.clear();
    await NetworkCache.clear();
});
