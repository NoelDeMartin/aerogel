import { App } from '@aerogel/core';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import { noop } from '@noeldemartin/utils';
import { describe, expect, it } from 'vite-plus/test';
import { createMemoryHistory, createRouter } from 'vue-router';

import { RouterService } from './Router';

describe('Router', () => {
    it('resolves model bindings before entering routes', async () => {
        // Arrange
        const post = await Post.create({});
        const slug = post.requireSlug();
        const router = new RouterService();

        App.ready.resolve();
        router.use(
            createRouter({
                history: createMemoryHistory(),
                routes: [{ path: '/posts/:post', component: { render: noop } }],
            }),
            {
                bindings: { post: Post },
            },
        );

        // Act
        await router.push(`/posts/${slug}`);

        // Assert
        expect((router.routesParams.value[`/posts/${slug}`]?.post as Post | undefined)?.url).toEqual(post.url);
    });
});
