import Router from '@aerogel/plugin-routing/services/Router';
import { noop } from '@noeldemartin/utils';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createApp } from 'vue';

import routing from './index';

vi.mock('vue-router', async () => {
    const original = (await vi.importActual('vue-router')) as Record<string, unknown>;

    return {
        ...original,
        createWebHistory: vi.fn(() => ({})),
    };
});

describe('Routing plugin', () => {
    it('Initializes router', async () => {
        // Arrange
        const routes = [{ name: 'home', path: '/home', component: noop }];

        // Act
        await routing({ routes }).install(createApp({}), {});

        // Assert
        expect(Router.hasRoute('home')).toBe(true);
    });
});
