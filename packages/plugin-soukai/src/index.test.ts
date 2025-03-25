import { IndexedDBEngine, requireBootedModel, requireEngine } from 'soukai';
import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import User from '@aerogel/plugin-soukai/testing/stubs/models/User';

import soukai from './index';

describe('Soukai plugin', () => {

    it('Initializes models and engine', async () => {
        // Arrange
        const models: Record<string, Record<string, unknown>> = import.meta.glob(
            '@aerogel/plugin-soukai/testing/stubs/models/*',
            { eager: true },
        );

        // Act
        await soukai({ models }).install(createApp({}), {});

        // Assert
        expect(requireBootedModel('User')).toEqual(User);
        expect(requireEngine()).toBeInstanceOf(IndexedDBEngine);
    });

});
