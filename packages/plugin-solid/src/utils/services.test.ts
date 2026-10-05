import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { beforeEach, describe, expect, it } from 'vite-plus/test';

import { _getTrackedModelsData } from './internal';
import { getTrackedModels, loadTrackedModels, refreshTrackedModels, resetTrackedModels, trackModels } from './services';

describe('Services helpers', () => {
    beforeEach(resetTrackedModels);

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
});
