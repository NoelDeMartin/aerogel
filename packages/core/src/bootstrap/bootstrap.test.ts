import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { mock } from '@noeldemartin/utils';
import type { Component } from 'vue';

import Events from '@/services/Events';
import initialFocus from '@/directives/initial-focus';

import { bootstrap } from './index';

describe('Aerogel', () => {

    beforeEach(() => {
        vi.stubGlobal('document', { getElementById: () => null });
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

    it('Boots services', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrap(rootComponent);

        // Assert
        const globals = vi.mocked(createApp).mock.results[0]?.value.config.globalProperties;

        expect(globals).property('$events').to.exist;
        expect(globals.$events).toBe(Events);
    });

    it('Registers directives', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrap(rootComponent);

        // Assert
        expect(vi.mocked(createApp).mock.results[0]?.value.directive).toHaveBeenCalledWith(
            'initial-focus',
            initialFocus,
        );
    });

});
