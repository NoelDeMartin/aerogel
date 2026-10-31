import { Errors } from '@aerogel/core';
import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import { CloudService } from '@aerogel/plugin-local-first/services/Cloud';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { Solid, useModels } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { CompleteSolidUserProfile } from '@noeldemartin/solid-utils';
import type { ListenersManager } from '@noeldemartin/utils';
import { Sync, TypeIndex, TypeRegistration } from 'soukai-bis';
import type { Model, ModelConstructor, ModelWithUrl, SyncConfig, SyncJobListener, SyncJobResult } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

class TestCloudService extends CloudService {
    public override getDirtyLocalModels(): Promise<Model[]> {
        return super.getDirtyLocalModels();
    }

    public override getSyncConfig(): Promise<SyncConfig> {
        return super.getSyncConfig();
    }

    public override migrateLocalUrls(): Promise<void> {
        return super.migrateLocalUrls();
    }
}

describe('Cloud', () => {
    let cloud: TestCloudService;

    const user: CompleteSolidUserProfile = {
        webId: 'https://alice.example/profile/card#me',
        shallow: false,
        cloakedDocumentUrls: [],
        publicTypeIndexUrls: [],
        privateTypeIndexUrls: [],
        storageUrls: ['https://alice.example/'],
        writableProfileUrl: 'https://alice.example/profile/card',
    };

    function logIn(): void {
        Solid.setState({ session: { user, loginUrl: user.webId, authenticator: {} as Authenticator } });
    }

    function fakeTypeIndex(registrations: [ModelConstructor, string][] = []): ModelWithUrl<TypeIndex> {
        const typeIndex = new TypeIndex({ url: 'https://alice.example/settings/privateTypeIndex' }, { exists: true });

        typeIndex.relatedRegistrations.related = registrations.map(
            ([modelClass, instanceContainer]) =>
                new TypeRegistration({
                    forClass: modelClass.schema.rdfClasses.map((rdfClass) => rdfClass.value),
                    instanceContainer,
                }),
        );

        return typeIndex as ModelWithUrl<TypeIndex>;
    }

    function fakeTypeIndexes(registrations: [ModelConstructor, string][] = []): void {
        vi.spyOn(Solid.requireInstance(), 'findTypeIndexes').mockResolvedValue({
            publicTypeIndexes: [],
            privateTypeIndexes: [fakeTypeIndex(registrations)],
        });
    }

    function fakeSync(
        options: {
            typeIndexes?: TypeIndex[];
            createdTypeIndex?: TypeIndex;
            failedRegistrations?: ModelConstructor[];
            onRun?: () => Promise<unknown>;
        } = {},
    ): void {
        vi.spyOn(cloud, 'getSyncConfig').mockResolvedValue({
            userProfile: user,
            applicationModels: [],
            privateTypeIndexes: options.typeIndexes ?? [],
        } as unknown as SyncConfig);
        vi.spyOn(Sync.prototype as unknown as { run(): Promise<SyncJobResult> }, 'run').mockImplementation(
            async function (this: Sync) {
                const { _listeners: listeners } = this as unknown as { _listeners: ListenersManager<SyncJobListener> };

                await options.onRun?.();

                if (options.createdTypeIndex) {
                    await listeners.emit('onModelsRegistered', options.createdTypeIndex, [Post]);
                }

                if (options.failedRegistrations) {
                    await listeners.emit(
                        'onModelsRegistrationFailed',
                        options.failedRegistrations,
                        new Error('Registration failed'),
                    );
                }

                return { syncedDocumentUrls: new Set(), documentsWithErrors: new Set() };
            },
        );
    }

    beforeEach(() => (cloud = new TestCloudService()));

    it('finds dirty models in registered containers', async () => {
        // Arrange
        await cloud.track(PostsCollection, { register: true });
        await cloud.track(Post);

        cloud.setState({ ready: true, autoPush: false });

        const collection = await PostsCollection.create({ name: 'Drafts' });
        const post = await collection.relatedPosts.create({ title: 'Hello' });

        // Act
        const models = await cloud.getDirtyLocalModels();

        // Assert
        expect(models.map((model) => [model.static().modelName, model.url])).toEqual([
            ['PostsCollection', collection.url],
            ['Post', post.url],
        ]);
    });

    it('ignores dirty models whose documents were deleted', async () => {
        // Arrange
        await cloud.track(Post);

        cloud.setState({ ready: true, autoPush: false });

        const post = await Post.create({ title: 'Hello' });

        await post.delete();

        // Act
        const models = await cloud.getDirtyLocalModels();

        // Assert
        expect(models).toHaveLength(0);
    });

    it('loads registered collections with their depth', async () => {
        // Arrange
        const post = await new Post({ title: 'Nested' }).save(`${Post.defaultContainerUrl}nested/`);

        await cloud.track(Post, { register: { depth: 1 } });

        // Act
        const { models: posts } = useModels(Post);

        // Assert
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });

    it('migrates local models to registered containers', async () => {
        // Arrange
        logIn();
        fakeTypeIndexes([[Post, 'https://alice.example/blog/']]);

        await cloud.track(Post, { register: true });
        await Post.create({ title: 'Offline' });

        // Act
        await cloud.migrateLocalUrls();

        // Assert
        const posts = await Post.all();

        expect(Post.defaultContainerUrl).toEqual('https://alice.example/blog/');
        expect(cloud.requireRemoteContainerUrl(Post)).toEqual('https://alice.example/blog/');
        expect(cloud.defaultContainerUrls).toEqual({ Post: 'https://alice.example/blog/' });
        expect(posts.map((post) => post.title)).toEqual(['Offline']);
        expect(posts[0]?.url.startsWith('https://alice.example/blog/')).toBe(true);
    });

    it('migrates local models to the registration path when they are not registered', async () => {
        // Arrange
        logIn();
        fakeTypeIndexes();

        await cloud.track(Post, { register: { path: '/articles/' } });

        // Act
        await cloud.migrateLocalUrls();

        // Assert
        expect(Post.defaultContainerUrl).toEqual('https://alice.example/articles/');
        expect(cloud.defaultContainerUrls).toEqual({ Post: 'https://alice.example/articles/' });
    });

    it('reads models from containers registered during sync', async () => {
        // Arrange
        logIn();
        fakeSync({ typeIndexes: [fakeTypeIndex([[Post, 'https://alice.example/blog/']])] });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        const post = await new Post({ title: 'Elsewhere' }).save('https://alice.example/blog/');

        await cloud.track(Post, { register: true });

        const findTypeIndexes = vi.spyOn(Solid.requireInstance(), 'findTypeIndexes');
        const { models: posts } = useModels(Post);

        await vi.waitFor(() => expect(posts.value).toEqual([]));

        // Act
        await cloud.sync();

        // Assert
        expect(findTypeIndexes).not.toHaveBeenCalled();
        expect(Post.defaultContainerUrl).toEqual('https://alice.example/blog/');
        expect(cloud.defaultContainerUrls).toEqual({ Post: 'https://alice.example/blog/' });

        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });

    it('reads models from type indexes created during sync', async () => {
        // Arrange
        logIn();
        fakeSync({ createdTypeIndex: fakeTypeIndex([[Post, 'https://alice.example/blog/']]) });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        await cloud.track(Post, { register: true });

        // Act
        await cloud.sync();

        // Assert
        expect(Post.defaultContainerUrl).toEqual('https://alice.example/blog/');
        expect(cloud.registeredContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });
    });

    it('keeps the default container when registration fails', async () => {
        // Arrange
        logIn();
        fakeSync({
            typeIndexes: [fakeTypeIndex([[Post, 'https://alice.example/blog/']])],
            failedRegistrations: [Post],
        });
        vi.spyOn(Errors.requireInstance(), 'report').mockResolvedValue();

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        const blogPost = await new Post({ title: 'Blog' }).save('https://alice.example/blog/');
        const post = await new Post({ title: 'Post' }).save('https://alice.example/posts/');

        await cloud.track(Post, { register: true });

        const { models: posts } = useModels(Post);

        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));

        // Act
        await cloud.sync();

        // Assert
        expect(Post.defaultContainerUrl).toEqual('https://alice.example/posts/');
        expect(cloud.defaultContainerUrls).toEqual({ Post: 'https://alice.example/posts/' });
        expect(cloud.registeredContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });

        await vi.waitFor(() =>
            expect(posts.value.map((model) => model.url).sort()).toEqual([blogPost.url, post.url].sort()),
        );
    });

    it('reads models from all registered containers', async () => {
        // Arrange
        logIn();
        fakeSync({
            typeIndexes: [
                fakeTypeIndex([
                    [Post, 'https://alice.example/blog/'],
                    [Post, 'https://alice.example/posts/'],
                ]),
            ],
        });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        const blogPost = await new Post({ title: 'Blog' }).save('https://alice.example/blog/');
        const post = await new Post({ title: 'Post' }).save('https://alice.example/posts/');

        await cloud.track(Post, { register: true });

        const { models: posts } = useModels(Post);

        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));

        // Act
        await cloud.sync();

        // Assert
        expect(Post.defaultContainerUrl).toEqual('https://alice.example/posts/');
        expect(cloud.defaultContainerUrls).toEqual({ Post: 'https://alice.example/posts/' });
        expect(cloud.registeredContainerUrls).toEqual({
            Post: ['https://alice.example/blog/', 'https://alice.example/posts/'],
        });

        await vi.waitFor(() =>
            expect(posts.value.map((model) => model.url).sort()).toEqual([blogPost.url, post.url].sort()),
        );
    });

    it('reads models from registered containers before syncing', async () => {
        // Arrange
        cloud.setState({
            ready: true,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            registeredContainerUrls: { Post: ['https://alice.example/blog/'] },
        });

        const blogPost = await new Post({ title: 'Blog' }).save('https://alice.example/blog/');
        const post = await new Post({ title: 'Post' }).save('https://alice.example/posts/');

        await cloud.track(Post, { register: true });

        // Act
        const { models: posts } = useModels(Post);

        // Assert
        await vi.waitFor(() =>
            expect(posts.value.map((model) => model.url).sort()).toEqual([blogPost.url, post.url].sort()),
        );
    });

    it('reads models created in unregistered containers', async () => {
        // Arrange
        logIn();
        fakeSync();

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            autoPush: false,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        await cloud.track(Post, { register: true });

        const { models: posts } = useModels(Post);
        const post = await new Post({ title: 'Elsewhere' }).save('https://alice.example/blog/');

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.unregisteredContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });
        expect(posts.value.map((model) => model.url)).toEqual([post.url]);
    });

    it('reads models from unregistered containers before syncing', async () => {
        // Arrange
        cloud.setState({
            ready: true,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            unregisteredContainerUrls: { Post: ['https://alice.example/blog/'] },
        });

        const blogPost = await new Post({ title: 'Blog' }).save('https://alice.example/blog/');

        await cloud.track(Post, { register: true });

        // Act
        const { models: posts } = useModels(Post);

        // Assert
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([blogPost.url]));
    });

    it('forgets unregistered containers once they are registered', async () => {
        // Arrange
        logIn();
        fakeSync({ typeIndexes: [fakeTypeIndex([[Post, 'https://alice.example/blog/']])] });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            unregisteredContainerUrls: { Post: ['https://alice.example/blog/'] },
        });

        await cloud.track(Post, { register: true });

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.registeredContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });
        expect(cloud.unregisteredContainerUrls).toEqual({ Post: [] });
    });

    it('pushes models created during sync', async () => {
        // Arrange
        let post: Post | null = null;

        logIn();
        fakeSync({ onRun: async () => (post ??= await Post.create({ title: 'During sync' })) });

        const push = vi.spyOn(SyncQueue.requireInstance(), 'push').mockReturnValue();

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        await cloud.track(Post, { register: true });

        // Act
        await cloud.sync();

        // Assert
        expect(push).toHaveBeenCalledExactlyOnceWith(post);
    });

    it('configures type index registrations', async () => {
        // Arrange
        logIn();

        await cloud.track(Post, { register: { public: true } });
        await cloud.track(PostsCollection, { register: true });

        // Act
        const config = await cloud.getSyncConfig();

        // Assert
        expect(config.userProfile).toEqual(user);
        expect(config.applicationModels).toEqual(
            expect.arrayContaining([
                { model: Post, registration: { path: undefined, public: true } },
                { model: PostsCollection, registration: { path: undefined, public: undefined } },
            ]),
        );
    });
});
