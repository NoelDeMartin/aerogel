import { Events } from '@aerogel/core';
import Book from '@aerogel/plugin-routing/testing/stubs/models/Book';
import Chapter from '@aerogel/plugin-routing/testing/stubs/models/Chapter';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import { resetReactiveState } from '@aerogel/reactivity';
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

beforeEach(() => {
    Events.reset();
    resetModelListeners();
    resetReactiveState();
    bootCoreModels({ reset: true });
    bootModels({ Book, Chapter, Post }, { reset: true });
    setEngine(new InMemoryEngine());
    setRemoteEngine(null);
});
