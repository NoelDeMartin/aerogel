import 'soukai-bis/patch-zod';
import { Events, NetworkCache, resetPiniaStore } from '@aerogel/core';
import FakeCacheStorage from '@aerogel/plugin-local-first/testing/stubs/FakeCacheStorage';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { resetModelsState } from '@aerogel/plugin-solid';
import { FakeLocalStorage, FakeServer } from '@noeldemartin/testing';
import {
    InMemoryEngine,
    Sync,
    bootCoreModels,
    bootModels,
    resetModelListeners,
    setEngine,
    setRemoteEngine,
} from 'soukai-bis';
import { SolidEngine } from 'soukai-bis';
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
    Events.reset();
    Sync.reset();
    FakeServer.reset();
    FakeLocalStorage.reset();
    resetPiniaStore();
    resetModelListeners();
    resetModelsState();
    bootCoreModels({ reset: true });
    bootModels({ Post, PostsCollection }, { reset: true });
    setEngine(new InMemoryEngine());
    setRemoteEngine(new SolidEngine({ fetch: FakeServer.fetch }));

    await NetworkCache.clear();
});
