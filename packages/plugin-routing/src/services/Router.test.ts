import { App } from '@aerogel/core';
import Book from '@aerogel/plugin-routing/testing/stubs/models/Book';
import Chapter from '@aerogel/plugin-routing/testing/stubs/models/Chapter';
import Post from '@aerogel/plugin-routing/testing/stubs/models/Post';
import BindingNotFound from '@aerogel/plugin-routing/utils/BindingNotFound';
import { trackModels } from '@aerogel/reactivity';
import { noop } from '@noeldemartin/utils';
import { InMemoryEngine, remote, setRemoteEngine } from 'soukai-bis';
import type { SolidEngine } from 'soukai-bis';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createMemoryHistory, createRouter } from 'vue-router';

import { RouterService } from './Router';
import type { RouteBindings } from './Router';

describe('Router', () => {
    it('resolves model bindings before entering routes', async () => {
        // Arrange
        const post = await Post.create({});
        const slug = post.requireSlug();
        const router = createTestRouter('/posts/:post', { post: Post });

        // Act
        await router.push(`/posts/${slug}`);

        // Assert
        expect((router.routesParams.value[`/posts/${slug}`]?.post as Post | undefined)?.url).toEqual(post.url);
    });

    it('resolves bindings separately for different url queries', async () => {
        // Arrange
        setRemoteEngine(new InMemoryEngine() as unknown as SolidEngine);

        const post = await Post.create({ url: 'local://posts/hello#it' });
        const remotePost = await remote(Post).create({ url: 'https://bob.example/posts/hello#it' });
        const remoteUrl = remotePost.requireUrl();
        const router = createTestRouter('/posts/:post', { post: Post });

        // Act
        await router.push('/posts/hello');
        await router.push({ path: '/posts/hello', query: { url: remoteUrl } });

        // Assert
        expect((router.routesParams.value['/posts/hello']?.post as Post | undefined)?.url).toEqual(post.url);
        expect((router.currentRoute.value?.params?.post as Post | undefined)?.url).toEqual(remoteUrl);
        expect(Object.keys(router.routesParams.value)).toHaveLength(2);
    });

    it('resolves parent bindings before child bindings without calling children twice', async () => {
        // Arrange
        const post = await Post.create({});
        const slug = post.requireSlug();
        const childBinding = vi.fn((childSlug: string, params: { post?: Post }) => ({
            childSlug,
            postUrl: params.post?.url,
        }));
        const router = createTestRouter('/posts/:post/:child', {
            post: Post,
            child: childBinding,
        });

        // Act
        await router.push(`/posts/${slug}/hello`);

        // Assert
        expect(childBinding).toHaveBeenCalledTimes(1);
        expect(childBinding.mock.calls[0]?.[0]).toEqual('hello');
        expect((childBinding.mock.calls[0]?.[1] as { post?: Post })?.post?.url).toEqual(post.url);
        expect(router.routesParams.value[`/posts/${slug}/hello`]?.child).toEqual({
            childSlug: 'hello',
            postUrl: post.url,
        });
    });

    it('skips child bindings when a parent binding is not found', async () => {
        // Arrange
        const childBinding = vi.fn();
        const router = createTestRouter('/posts/:post/:child', {
            post: Post,
            child: childBinding,
        });

        // Act
        await router.push('/posts/missing/hello');

        // Assert
        expect(childBinding).not.toHaveBeenCalled();
        expect(router.routesParams.value['/posts/missing/hello']?.post).toBeInstanceOf(BindingNotFound);
        expect(router.routesParams.value['/posts/missing/hello']?.child).toBeInstanceOf(BindingNotFound);
    });

    it('resolves nested model bindings automatically via parent relations', async () => {
        // Arrange
        trackModels(Book);

        const book = await Book.create({});
        const chapter = await book.relatedChapters.create({});
        const bookSlug = book.requireSlug();
        const chapterSlug = chapter.requireSlug();
        const router = createTestRouter('/books/:book/:chapter', {
            book: Book,
            chapter: Chapter,
        });

        // Act
        await router.push(`/books/${bookSlug}/${chapterSlug}`);

        // Assert
        expect((router.routesParams.value[`/books/${bookSlug}/${chapterSlug}`]?.book as Book | undefined)?.url).toEqual(
            book.url,
        );
        expect(
            (router.routesParams.value[`/books/${bookSlug}/${chapterSlug}`]?.chapter as Chapter | undefined)?.url,
        ).toEqual(chapter.url);
    });

    function createTestRouter(path: string, bindings: RouteBindings): RouterService {
        const router = new RouterService();

        App.ready.resolve();
        router.use(
            createRouter({
                history: createMemoryHistory(),
                routes: [{ path, component: { render: noop } }],
            }),
            { bindings },
        );

        return router;
    }
});
