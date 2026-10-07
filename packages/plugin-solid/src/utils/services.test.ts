import { Cache } from '@aerogel/core';
import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { computedModels } from './composition';
import { _getTrackedModelsData } from './internal';
import {
    findTrackedModel,
    getTrackedModels,
    loadTrackedModels,
    refreshTrackedModels,
    resetModelsState,
    trackModels,
} from './services';

describe('Services helpers', () => {
    beforeEach(resetModelsState);

    it('Loads lazily tracked models when they are tracked again', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        await trackModels(User, { bypassServicesCheck: true, lazy: true });

        // Act
        await trackModels(User, { bypassServicesCheck: true });

        // Assert
        expect(getTrackedModels(User).map((user) => user.name)).toEqual(['Alice']);
    });

    it('Loads tracked models once', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        await trackModels(User, { bypassServicesCheck: true, lazy: true });

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
        await trackModels(User, { bypassServicesCheck: true, lazy: true });

        // Act
        await refreshTrackedModels(User);

        // Assert
        expect(_getTrackedModelsData(User).loaded.value).toBe(false);
        expect(getTrackedModels(User)).toHaveLength(0);
    });

    it('Finds models without adding them to loaded collections', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });

        const bob = await new User({ name: 'Bob', age: 30 }).save('solid://others/');

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
        vi.useFakeTimers({ toFake: ['Date'] });
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

        vi.useRealTimers();
    });

    it('Restores cached models before collections are loaded', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });

        await Cache.set('users', [alice.serialize()]);
        await trackModels(User, { bypassServicesCheck: true, lazy: true });

        // Act
        const users = computedModels(User, () => getTrackedModels(User), { cache: 'users' });

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
