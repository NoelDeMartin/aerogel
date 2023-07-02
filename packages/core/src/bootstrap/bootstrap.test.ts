import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { IndexedDBEngine, requireBootedModel, requireEngine } from 'soukai';
import { mock } from '@noeldemartin/utils';
import type { Component } from 'vue';

import Events from '@/services/Events';
import initialFocus from '@/directives/initial-focus';
import User from '@/testing/stubs/models/User';

import { bootstrapApplication } from './index';

describe('Aerogel', () => {

    beforeEach(() => {
        vi.mock('vue', async () => {
            const vue = (await vi.importActual('vue')) as Object;

            return {
                ...vue,
                createApp: vi.fn(() => ({
                    mount: vi.fn(),
                    use: vi.fn(),
                    directive: vi.fn(),
                    config: { globalProperties: {} },
                })),
            };
        });
    });

    it('Initializes Soukai', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent, {
            models: import.meta.glob('@/testing/stubs/models/*', { eager: true }),
        });

        // Assert
        expect(requireBootedModel('User')).toEqual(User);
        expect(requireEngine()).toBeInstanceOf(IndexedDBEngine);
    });

    it('Boots services', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent);

        // Assert
        const globals = vi.mocked(createApp).mock.results[0]?.value.config.globalProperties;

        expect(globals).property('$events').to.exist;
        expect(globals.$events).toBe(Events);
    });

    it('Registers directives', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent);

        // Assert
        expect(vi.mocked(createApp).mock.results[0]?.value.directive).toHaveBeenCalledWith(
            'initial-focus',
            initialFocus,
        );
    });

});
