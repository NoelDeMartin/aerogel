import Book from '@aerogel/plugin-routing/testing/stubs/models/Book';
import Chapter from '@aerogel/plugin-routing/testing/stubs/models/Chapter';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import BindingNotFound from '@aerogel/plugin-routing/utils/BindingNotFound';
import { getTrackedModels, loadTrackedModels, trackModels } from '@aerogel/plugin-solid';
import { InMemoryEngine, remote, setRemoteEngine } from 'soukai-bis';
import type { SolidEngine } from 'soukai-bis';
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

    it('resolves remote models by url before falling back to slugs', async () => {
        // Arrange
        setRemoteEngine(new InMemoryEngine() as unknown as SolidEngine);

        const post = await Post.create({ url: 'local://posts/hello#it' });
        const remotePost = await remote(Post).create({ url: 'https://bob.example/posts/hello#it' });

        await trackModels(Post, { bypassServicesCheck: true, lazy: true });
        await loadTrackedModels(Post);

        // Act
        const binding = await resolveModelBinding(Post, 'hello', routeWithUrl(remotePost.requireUrl()));

        // Assert
        expect(binding.url).toEqual(remotePost.url);
        expect(getTrackedModels(Post).map((model) => model.url)).toEqual([post.url]);
    });

    it('does not fall back to slugs for unreachable remote urls', async () => {
        // Arrange
        setRemoteEngine(new InMemoryEngine() as unknown as SolidEngine);

        await Post.create({ url: 'local://posts/hello#it' });
        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        // Act
        const binding = await resolveModelBinding(Post, 'hello', routeWithUrl('https://bob.example/posts/hello#it'));

        // Assert
        expect(binding).toBeInstanceOf(BindingNotFound);
    });

    it('resolves missing models as not found', async () => {
        // Arrange
        await trackModels(Post, { bypassServicesCheck: true, lazy: true });

        // Act
        const binding = await resolveModelBinding(Post, 'missing', routeWithUrl('local://posts/missing#it'));

        // Assert
        expect(binding).toBeInstanceOf(BindingNotFound);
    });

    it('resolves related models from parent relations', async () => {
        // Arrange
        const book = await Book.create({});
        const chapter = await book.relatedChapters.create({});

        await book.relatedChapters.create({});
        await trackModels(Chapter, { bypassServicesCheck: true, lazy: true });

        // Act
        const resolved = await resolveModelBinding(Chapter, chapter.requireSlug(), null, { book });
        const missing = await resolveModelBinding(Chapter, '999', null, { book });

        // Assert
        expect(resolved.url).toEqual(chapter.url);
        expect(getTrackedModels(Chapter)).toEqual([resolved]);
        expect(missing).toBeInstanceOf(BindingNotFound);
    });

    it('resolves related models from parent relations using url query', async () => {
        // Arrange
        const book = await Book.create({});
        const chapter = await book.relatedChapters.create({});
        const otherChapter = await book.relatedChapters.create({});

        await trackModels(Chapter, { bypassServicesCheck: true, lazy: true });

        // Act
        const byUrl = await resolveModelBinding(Chapter, 'chapter', routeWithUrl(chapter.requireUrl()), { book });
        const bySlug = await resolveModelBinding(
            Chapter,
            otherChapter.requireSlug(),
            routeWithUrl('local://chapters/missing#it'),
            { book },
        );

        // Assert
        expect(byUrl.url).toEqual(chapter.url);
        expect(bySlug.url).toEqual(otherChapter.url);
    });
});
