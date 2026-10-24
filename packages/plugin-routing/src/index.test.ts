import { defineModule } from '@aerogel/core';
import Router from '@aerogel/plugin-routing/services/Router';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
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

    it('Registers module routes and bindings', async () => {
        // Arrange
        const use = vi.spyOn(Router.requireInstance(), 'use');
        const routes = [{ name: 'home', path: '/home', component: noop }];
        const posts = defineModule({
            routes: [{ name: 'posts.show', path: '/posts/:post', component: noop }],
            bindings: { post: Post },
        });

        // Act
        await routing({ routes }).install(createApp({}), { modules: [posts] });

        // Assert
        expect(Router.hasRoute('home')).toBe(true);
        expect(Router.hasRoute('posts.show')).toBe(true);
        expect(use).toHaveBeenCalledWith(expect.anything(), { bindings: { post: Post } });
    });

    it('Initializes router without root routes', async () => {
        // Arrange
        const posts = defineModule({
            routes: [{ name: 'posts.index', path: '/posts', component: noop }],
        });

        // Act
        await routing().install(createApp({}), { modules: [posts] });

        // Assert
        expect(Router.hasRoute('posts.index')).toBe(true);
    });
});
