import type { LoadedRoute } from '@aerogel/plugin-routing/services/Router';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import BindingNotFound from '@aerogel/plugin-routing/utils/BindingNotFound';
import { trackModels } from '@aerogel/plugin-solid';
import { describe, expect, it } from 'vite-plus/test';

import { resolveModelBinding } from './soukai';

function routeWithUrl(url: string): LoadedRoute {
    return { query: { url } } as unknown as LoadedRoute;
}

describe('Model bindings', () => {
    it('loads collections that have not been loaded yet', async () => {
        // Arrange
        const post = await Post.create({});

        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        // Act
        const binding = await resolveModelBinding(Post, 'post', routeWithUrl(post.requireUrl()));

        // Assert
        expect(binding.url).toEqual(post.url);
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
