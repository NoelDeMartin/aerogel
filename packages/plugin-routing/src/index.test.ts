import { createApp } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { noop } from '@noeldemartin/utils';

import Router from '@aerogel/plugin-routing/services/Router';

import routing from './index';

describe('Routing plugin', () => {

    it('Initializes router', async () => {
        // Arrange
        const routes = [{ name: 'home', path: '/home', component: noop }];

        vi.mock('vue-router', async () => {
            const original = (await vi.importActual('vue-router')) as Object;

            return {
                ...original,
                createWebHistory: vi.fn(() => ({})),
            };
        });

        // Act
        await routing({ routes }).install(createApp({}), {});

        // Assert
        expect(Router.hasRoute('home')).toBe(true);
    });

});
