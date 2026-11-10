import 'soukai-bis/patch-zod';
import 'fake-indexeddb/auto';
import { bootModels, setupAsyncContext } from '@aerogel/plugin-solid/utils/soukai';
import { ComputedAttributesCache, InMemoryEngine, setEngine } from 'soukai-bis';
import { beforeAll, beforeEach } from 'vite-plus/test';

beforeAll(async () => {
    const { default: appModels } = await import('virtual:aerogel-models');

    setupAsyncContext();
    bootModels(appModels);
});

beforeEach(async () => {
    setEngine(new InMemoryEngine());

    await ComputedAttributesCache.clear();
});
