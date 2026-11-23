import { computedModels } from '@aerogel/reactivity/composables/computedModels';
import { getTrackedModelsData } from '@aerogel/reactivity/internals/tracking';
import {
    findTrackedModel,
    getTrackedModels,
    loadTrackedModels,
    loadTrackedSingletonModel,
    refreshTrackedModels,
    resetModelsState,
    setTrackedModelsDiscoveryUrls,
    trackModels,
} from '@aerogel/reactivity/lib/tracking';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import TestingComputedModelsCache from '@aerogel/reactivity/testing/TestingComputedModelsCache';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

describe('Tracking helpers', () => {
    beforeEach(resetModelsState);

    it('Loads tracked models on demand', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        trackModels(User);

        const trackedBeforeLoading = getTrackedModels(User);

        // Act
        await loadTrackedModels(User);

        // Assert
        expect(trackedBeforeLoading).toHaveLength(0);
        expect(getTrackedModels(User).map((user) => user.name)).toEqual(['Alice']);
    });

    it('Tracks models with a single depth', () => {
        // Arrange
        trackModels(User, { depth: 1 });

        // Act
        const trackWithOtherDepth = () => trackModels(User, { depth: 2 });

        // Assert
        expect(trackWithOtherDepth).toThrow('Model collection is already being tracked with a different depth');
    });

    it('Loads tracked models from all their containers', async () => {
        // Arrange
        const alice = await new User({ name: 'Alice', age: 23 }).save({ containerUrl: 'https://alice.example/users/' });
        const bob = await new User({ name: 'Bob', age: 30 }).save({ containerUrl: 'https://alice.example/people/' });

        await User.create({ name: 'Charlie', age: 40 });

        setTrackedModelsDiscoveryUrls(User, ['https://alice.example/users/', 'https://alice.example/people/']);

        // Act
        await loadTrackedModels(User);

        // Assert
        expect(getTrackedModels(User).map((user) => user.url)).toEqual([alice.url, bob.url]);
    });

    it('Loads tracked models from containers and model urls', async () => {
        // Arrange
        const alice = await new User({ name: 'Alice', age: 23 }).save({ containerUrl: 'https://alice.example/users/' });
        const bob = await new User({ name: 'Bob', age: 30 }).save({ containerUrl: 'https://alice.example/people/' });

        await User.create({ name: 'Charlie', age: 40 });

        setTrackedModelsDiscoveryUrls(User, ['https://alice.example/people/', alice.requireUrl()]);

        // Act
        await loadTrackedModels(User);

        // Assert
        expect(getTrackedModels(User).map((user) => user.url)).toEqual([alice.url, bob.url]);
    });

    it('Loads singleton models from their urls first', async () => {
        // Arrange
        await new User({ name: 'Alice', age: 23 }).save({ containerUrl: 'https://alice.example/users/' });

        const bob = await new User({ name: 'Bob', age: 30 }).save({ containerUrl: 'https://alice.example/people/' });

        setTrackedModelsDiscoveryUrls(User, ['https://alice.example/users/', bob.requireUrl()]);

        // Act
        const singleton = await loadTrackedSingletonModel(User);

        // Assert
        expect(singleton?.url).toEqual(bob.url);
    });

    it('Loads tracked models once', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        trackModels(User);

        // Act
        await Promise.all([loadTrackedModels(User), loadTrackedModels(User)]);
        await User.create({ name: 'Bob', age: 30 });
        await loadTrackedModels(User);

        // Assert
        expect(getTrackedModels(User).map((user) => user.name)).toEqual(['Alice', 'Bob']);
    });

    it('Skips refreshing models that have not been loaded', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        trackModels(User);

        // Act
        await refreshTrackedModels(User);

        // Assert
        expect(getTrackedModelsData(User).loaded.value).toBe(false);
        expect(getTrackedModels(User)).toHaveLength(0);
    });

    it('Finds models without adding them to loaded collections', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });

        const bob = await new User({ name: 'Bob', age: 30 }).save({ containerUrl: 'local://others/' });

        await loadTrackedModels(User);

        // Act
        const model = await findTrackedModel(User, bob.requireUrl());

        // Assert
        expect(model?.name).toEqual('Bob');
        expect(getTrackedModels(User).map((user) => user.name)).toEqual(['Alice']);
    });

    it('Reuses tracked instances when loading collections', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const trackedAlice = await findTrackedModel(User, alice.requireUrl());

        // Act
        await loadTrackedModels(User);

        // Assert
        expect(getTrackedModels(User)).toHaveLength(1);
        expect(getTrackedModels(User)[0]).toBe(trackedAlice);
    });

    it('Replaces outdated tracked instances when loading collections', async () => {
        // Arrange
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

        const alice = await User.create({ name: 'Alice', age: 23 });
        const trackedAlice = await findTrackedModel(User, alice.requireUrl());

        vi.setSystemTime(new Date('2026-01-02T00:00:00Z'));

        await (await User.findOrFail(alice.requireUrl())).update({ name: 'Alicia' });

        // Act
        await loadTrackedModels(User);

        // Assert
        expect(getTrackedModels(User)).toHaveLength(1);
        expect(getTrackedModels(User)[0]).not.toBe(trackedAlice);
        expect(getTrackedModels(User)[0]?.name).toEqual('Alicia');
    });

    it('Restores cached models before collections are loaded', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });

        await TestingComputedModelsCache.set('users', [{ '@model': alice.serialize() }]);
        trackModels(User);

        // Act
        const users = computedModels(User, () => getTrackedModels(User), { cacheKey: 'users' });

        await vi.waitFor(() => expect(users.value).toHaveLength(1));

        const restoredAlice = getTrackedModels(User)[0];

        await loadTrackedModels(User);

        // Assert
        expect(restoredAlice).not.toBe(alice);
        expect(restoredAlice?.name).toEqual('Alice');
        expect(getTrackedModels(User)).toHaveLength(1);
        expect(getTrackedModels(User)[0]).toBe(restoredAlice);
    });
});
