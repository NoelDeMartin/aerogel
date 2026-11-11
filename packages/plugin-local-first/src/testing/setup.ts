import 'soukai-bis/patch-zod';
import { Events, resetPiniaStore } from '@aerogel/core';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { resetModelsState } from '@aerogel/plugin-solid';
import { FakeLocalStorage, FakeServer } from '@noeldemartin/testing';
import { InMemoryEngine, bootCoreModels, bootModels, resetModelListeners, setEngine, setRemoteEngine } from 'soukai-bis';
import { beforeEach, vi } from 'vite-plus/test';
import { SolidEngine } from 'soukai-bis';

vi.mock('@aerogel/core', async () => {
    const { FakeLocalStorage } = await import('@noeldemartin/testing');
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();

    return original;
});

beforeEach(() => {
    Events.reset();
    FakeLocalStorage.reset();
    FakeServer.reset();
    resetPiniaStore();
    resetModelListeners();
    resetModelsState();
    bootCoreModels({ reset: true });
    bootModels({ Post, PostsCollection }, { reset: true });
    setEngine(new InMemoryEngine());
    setRemoteEngine(new SolidEngine({ fetch: FakeServer.fetch }));
});
