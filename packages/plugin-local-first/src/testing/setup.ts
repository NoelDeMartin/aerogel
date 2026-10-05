import 'soukai-bis/patch-zod';
import { Events, resetPiniaStore } from '@aerogel/core';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { resetTrackedModels } from '@aerogel/plugin-solid';
import { FakeLocalStorage } from '@noeldemartin/testing';
import { InMemoryEngine, bootCoreModels, bootModels, resetModelListeners, setEngine } from 'soukai-bis';
import { beforeEach, vi } from 'vite-plus/test';

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
    resetPiniaStore();
    resetModelListeners();
    resetTrackedModels();
    bootCoreModels({ reset: true });
    bootModels({ Post, PostsCollection }, { reset: true });
    setEngine(new InMemoryEngine());
});
