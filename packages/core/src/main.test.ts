import { Component, createApp } from 'vue';
import { it, describe, expect, vi, beforeEach } from 'vitest';
import { mock } from '@noeldemartin/utils';
import { IndexedDBEngine, requireBootedModel, requireEngine } from 'soukai';

import User from '@/testing/stubs/models/User';

import { bootstrapApplication } from './main';

describe('Aerogel', () => {

    beforeEach(() => {
        vi.mock('vue', () => ({ createApp: vi.fn(() => ({ mount: vi.fn() })) }));
    });

    it('Mounts the Vue application', () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        bootstrapApplication(rootComponent);

        // Assert
        expect(createApp).toHaveBeenCalledWith(rootComponent);
        expect(vi.mocked(createApp).mock.results[0]?.value.mount).toHaveBeenCalled();
    });

    it('Initializes Soukai', () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        bootstrapApplication(rootComponent, {
            models: import.meta.glob('@/testing/stubs/models/*', { eager: true })
        });

        // Assert
        expect(requireBootedModel('User')).toEqual(User);
        expect(requireEngine()).toBeInstanceOf(IndexedDBEngine);
    });

});
