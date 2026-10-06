import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { beforeEach, describe, expect, it } from 'vite-plus/test';

import { _getTrackedModelsData } from './internal';
import {
    findTrackedModel,
    getTrackedModels,
    loadRelations,
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

    it('Loads relations for many models', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const users = await Promise.all([User.findOrFail(alice.url), User.findOrFail(bob.url)]);
        const loadedRelations: unknown[] = [];

        users.forEach((user) => user.relatedMetadata?.unload());
        User.on('relation-loaded', (_, relation) => loadedRelations.push(relation));

        // Act
        await loadRelations(User, users, ['metadata']);

        // Assert
        expect(users.every((user) => user.isRelationLoaded('metadata'))).toBe(true);
        expect(users.map((user) => user.createdAt)).toEqual([alice.createdAt, bob.createdAt]);
        expect(loadedRelations).toHaveLength(2);
    });

    it('Skips loading relations that are already loaded', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const loadedRelations: unknown[] = [];

        User.on('relation-loaded', (_, relation) => loadedRelations.push(relation));

        // Act
        await loadRelations(User, [alice], ['metadata']);

        // Assert
        expect(loadedRelations).toHaveLength(0);
    });
});
