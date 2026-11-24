import Book from '@aerogel/plugin-routing/testing/stubs/models/Book';
import Chapter from '@aerogel/plugin-routing/testing/stubs/models/Chapter';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import BindingNotFound from '@aerogel/plugin-routing/utils/BindingNotFound';
import { getTrackedModels, loadTrackedModels, trackModels } from '@aerogel/reactivity';
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
        trackModels(Post);

        // Act
        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: 'post',
            route: routeWithUrl(post.requireUrl()),
        });

        // Assert
        expect(binding.url).toEqual(post.url);
        expect(getTrackedModels(Post)).toEqual([binding]);
    });

    it('resolves models by slug without loading collections', async () => {
        // Arrange
        const post = await Post.create({});

        await Post.create({});
        trackModels(Post);

        // Act
        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: post.requireSlug(),
        });

        // Assert
        expect(binding.url).toEqual(post.url);
        expect(getTrackedModels(Post)).toEqual([binding]);
    });

    it('reuses resolved models when collections are loaded', async () => {
        // Arrange
        const post = await Post.create({});

        await Post.create({});
        trackModels(Post);

        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: post.requireSlug(),
        });

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

        trackModels(Post);
        await loadTrackedModels(Post);

        // Act
        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: 'hello',
            route: routeWithUrl(remotePost.requireUrl()),
        });

        // Assert
        expect(binding.url).toEqual(remotePost.url);
        expect(getTrackedModels(Post).map((model) => model.url)).toEqual([post.url]);
    });

    it('does not fall back to slugs for unreachable remote urls', async () => {
        // Arrange
        setRemoteEngine(new InMemoryEngine() as unknown as SolidEngine);

        await Post.create({ url: 'local://posts/hello#it' });
        trackModels(Post);

        // Act
        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: 'hello',
            route: routeWithUrl('https://bob.example/posts/hello#it'),
        });

        // Assert
        expect(binding).toBeInstanceOf(BindingNotFound);
    });

    it('falls back to slug when url query does not match the model slug', async () => {
        // Arrange
        const post = await Post.create({ url: 'local://posts/hello#it' });

        trackModels(Post);

        // Act
        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: 'hello',
            route: routeWithUrl('https://bob.example/posts/hello/chapters/001#it'),
        });

        // Assert
        expect(binding.url).toEqual(post.url);
    });

    it('resolves missing models as not found', async () => {
        // Arrange
        trackModels(Post);

        // Act
        const binding = await resolveModelBinding({
            modelClass: Post,
            bindingName: 'post',
            slug: 'missing',
            route: routeWithUrl('local://posts/missing#it'),
        });

        // Assert
        expect(binding).toBeInstanceOf(BindingNotFound);
    });

    it('resolves related models from parent relations', async () => {
        // Arrange
        const book = await Book.create({});
        const chapter = await book.relatedChapters.create({});

        await book.relatedChapters.create({});
        trackModels(Chapter);

        // Act
        const resolved = await resolveModelBinding({
            modelClass: Chapter,
            bindingName: 'chapter',
            slug: chapter.requireSlug(),
            parentParams: { book },
        });
        const missing = await resolveModelBinding({
            modelClass: Chapter,
            bindingName: 'chapter',
            slug: '999',
            parentParams: { book },
        });

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

        trackModels(Chapter);

        // Act
        const byUrl = await resolveModelBinding({
            modelClass: Chapter,
            bindingName: 'chapter',
            slug: 'chapter',
            route: routeWithUrl(chapter.requireUrl()),
            parentParams: { book },
        });
        const bySlug = await resolveModelBinding({
            modelClass: Chapter,
            bindingName: 'chapter',
            slug: otherChapter.requireSlug(),
            route: routeWithUrl('local://chapters/missing#it'),
            parentParams: { book },
        });

        // Assert
        expect(byUrl.url).toEqual(chapter.url);
        expect(bySlug.url).toEqual(otherChapter.url);
    });
});
