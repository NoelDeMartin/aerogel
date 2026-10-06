import { Events } from '@aerogel/core';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import { resetModelsState } from '@aerogel/plugin-solid';
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
    resetModelListeners();
    resetModelsState();
    bootCoreModels({ reset: true });
    bootModels({ Post }, { reset: true });
    setEngine(new InMemoryEngine());
});
