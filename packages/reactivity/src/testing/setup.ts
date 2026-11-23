import 'fake-indexeddb/auto';
import { setComputedModelsCache } from '@aerogel/reactivity/lib/config';
import Book from '@aerogel/reactivity/testing/stubs/models/Book';
import Chapter from '@aerogel/reactivity/testing/stubs/models/Chapter';
import Item from '@aerogel/reactivity/testing/stubs/models/Item';
import Post from '@aerogel/reactivity/testing/stubs/models/Post';
import Shelf from '@aerogel/reactivity/testing/stubs/models/Shelf';
import Task from '@aerogel/reactivity/testing/stubs/models/Task';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import TestingComputedModelsCache from '@aerogel/reactivity/testing/TestingComputedModelsCache';
import {
    InMemoryEngine,
    bootCoreModels,
    bootModels,
    resetModelListeners,
    setEngine,
    setRemoteEngine,
} from 'soukai-bis';
import { beforeEach, vi } from 'vite-plus/test';

setComputedModelsCache(TestingComputedModelsCache);

beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.restoreAllMocks();
    resetModelListeners();
    bootCoreModels({ reset: true });
    bootModels({ Book, Chapter, Item, Post, Shelf, Task, User }, { reset: true });
    setEngine(new InMemoryEngine());
    setRemoteEngine(null);

    await TestingComputedModelsCache.clear();
});
