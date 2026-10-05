import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import BindingNotFound from '@aerogel/plugin-routing/utils/BindingNotFound';
import { getTrackedModels, loadTrackedModels, trackModels } from '@aerogel/plugin-solid';
import { describe, expect, it } from 'vite-plus/test';
import type { RouteLocationNormalized } from 'vue-router';

import { resolveModelBinding } from './soukai';

function routeWithUrl(url: string): RouteLocationNormalized {
    return { query: { url } } as unknown as RouteLocationNormalized;
}

describe('Model bindings', () => {
    it('resolves models by url without loading collections', async () => {
        // Arrange
        const post = await Post.create({});

        await Post.create({});
        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        // Act
        const binding = await resolveModelBinding(Post, 'post', routeWithUrl(post.requireUrl()));

        // Assert
        expect(binding.url).toEqual(post.url);
        expect(getTrackedModels(Post)).toEqual([binding]);
    });

    it('resolves models by slug without loading collections', async () => {
        // Arrange
        const post = await Post.create({});

        await Post.create({});
        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        // Act
        const binding = await resolveModelBinding(Post, post.requireSlug(), null);

        // Assert
        expect(binding.url).toEqual(post.url);
        expect(getTrackedModels(Post)).toEqual([binding]);
    });

    it('reuses resolved models when collections are loaded', async () => {
        // Arrange
        const post = await Post.create({});

        await Post.create({});
        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        const binding = await resolveModelBinding(Post, post.requireSlug(), null);

        // Act
        await loadTrackedModels(Post);

        // Assert
        expect(getTrackedModels(Post)).toHaveLength(2);
        expect(getTrackedModels(Post).find((model) => model.url === post.url)).toBe(binding);
    });

    it('resolves missing models as not found', async () => {
        // Arrange
        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        // Act
        const binding = await resolveModelBinding(Post, 'missing', routeWithUrl('solid://posts/missing#it'));

        // Assert
        expect(binding).toBeInstanceOf(BindingNotFound);
    });
});
