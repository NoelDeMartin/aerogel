import { IndexedDBEngine, requireBootedModel, requireEngine } from 'soukai';
import { describe, expect, it } from 'vitest';
import type { App } from 'vue';

import User from '@/testing/stubs/models/User';

import soukai from './main';

describe('Soukai', () => {

    it('Initializes models and engine', async () => {
        // Act
        soukai({ models: import.meta.glob('@/testing/stubs/models/*', { eager: true }) }).install(
            null as unknown as App,
        );

        // Assert
        expect(requireBootedModel('User')).toEqual(User);
        expect(requireEngine()).toBeInstanceOf(IndexedDBEngine);
    });

});
