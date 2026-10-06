import { Errors, bootServices } from '@aerogel/core';
import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { IndexedDBEngine, Metadata, requireBootedModel, requireEngine } from 'soukai-bis';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createApp } from 'vue';

import solid from './index';

vi.mock('virtual:aerogel-models', () => ({
    default: import.meta.glob('@aerogel/plugin-solid/testing/stubs/models/*', { eager: true }),
}));

describe('Solid plugin', () => {
    it('Initializes models', async () => {
        // Arrange
        const app = createApp({});

        await bootServices(app, { $errors: Errors });

        // Act
        await solid().install(app, {});

        // Assert
        expect(requireBootedModel('Metadata')).toEqual(Metadata);
    });

    it('Initializes models and engine', async () => {
        // Act
        await solid().install(createApp({}), {});

        // Assert
        expect(requireBootedModel('User')).toEqual(User);
        expect(requireEngine()).toBeInstanceOf(IndexedDBEngine);
    });
});
