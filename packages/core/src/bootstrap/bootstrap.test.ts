import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { mock } from '@noeldemartin/testing';
import { z } from 'zod';
import type { Component } from 'vue';

import Events from '@aerogel/core/services/Events';
import measure from '@aerogel/core/directives/measure';
import { env } from '@aerogel/core/utils/env';
import type { Env } from '@aerogel/core/utils/env';

import { bootstrap } from './index';

describe('Aerogel', () => {

    beforeEach(() => {
        vi.mock('vue', async () => {
            const vue = (await vi.importActual('vue')) as object;

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

        expect(globals).to.have.property('$events');
        expect(globals.$events).toBe(Events);
    });

    it('Extends env definitions', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrap(rootComponent, {
            env: z.object({
                FOOBAR: z.string().default('foobar'),
            }),
        });

        // Assert
        expect(env('FOOBAR' as keyof Env)).to.equal('foobar');
    });

    it('Registers directives', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrap(rootComponent);

        // Assert
        expect(vi.mocked(createApp).mock.results[0]?.value.directive).toHaveBeenCalledWith('measure', measure);
    });

});
