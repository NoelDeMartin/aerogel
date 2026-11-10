import { Errors, Events } from '@aerogel/core';
import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import { CloudService } from '@aerogel/plugin-local-first/services/Cloud';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { Solid, useModels, useSingletonModel } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { CompleteSolidUserProfile } from '@noeldemartin/solid-utils';
import { after } from '@noeldemartin/utils';
import type { ListenersManager } from '@noeldemartin/utils';
import { Sync, TypeIndex, TypeRegistration, requireEngine } from 'soukai-bis';
import type {
    Model,
    ModelConstructor,
    ModelWithUrl,
    SyncConfig,
    ExternalSource,
    SyncJobListener,
    SyncJobResult,
} from 'soukai-bis';
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

    public override serializePersistedState(state: Parameters<CloudService['serializePersistedState']>[0]) {
        return super.serializePersistedState(state);
    }

    public override deserializePersistedState(state: Parameters<CloudService['deserializePersistedState']>[0]) {
        return super.deserializePersistedState(state);
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
            failedExternalSources?: [ExternalSource, unknown][];
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
                    await listeners.emit('onModelsRegistered', {
                        typeIndex: options.createdTypeIndex,
                        models: [Post],
                        mode: 'container',
                    });
                }

                if (options.failedRegistrations) {
                    await listeners.emit('onModelsRegistrationFailed', {
                        models: options.failedRegistrations,
                        error: new Error('Registration failed'),
                        mode: 'container',
                    });
                }

                for (const [source, error] of options.failedExternalSources ?? []) {
                    await listeners.emit('onExternalSourceFailed', source, error);
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

    it('reads singleton models from registered instances', async () => {
        // Arrange
        logIn();

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        const registeredPost = await new Post({ title: 'Registered' }).save('https://alice.example/blog/');
        const typeIndex = fakeTypeIndex();

        typeIndex.relatedRegistrations.related = [
            new TypeRegistration({
                forClass: Post.schema.rdfClasses.map((rdfClass) => rdfClass.value),
                instance: registeredPost.url,
            }),
        ];

        fakeSync({ typeIndexes: [typeIndex] });

        const post = await new Post({ title: 'Post' }).save('https://alice.example/posts/');

        await cloud.track(Post, { register: { singleton: true } });

        const { model: singletonPost } = useSingletonModel(Post);

        await vi.waitFor(() => expect(singletonPost.value?.url).toEqual(post.url));

        // Act
        await cloud.sync();

        // Assert
        expect(Post.defaultContainerUrl).toEqual('https://alice.example/posts/');
        expect(cloud.registeredContainerUrls).toEqual({ Post: [] });
        expect(cloud.registeredInstanceUrls).toEqual({ Post: [registeredPost.url] });

        await vi.waitFor(() => expect(singletonPost.value?.url).toEqual(registeredPost.url));
    });

    it('reads singleton models from the default container before they are registered', async () => {
        // Arrange
        logIn();

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        const post = await new Post({ title: 'Post' }).save('https://alice.example/posts/');

        // Act
        await cloud.track(Post, { register: { singleton: true } });

        const { model: singletonPost } = useSingletonModel(Post);

        // Assert
        await vi.waitFor(() => expect(singletonPost.value?.url).toEqual(post.url));
        expect(cloud.registeredInstanceUrls).toEqual({});
    });

    it('reads singleton models from registered containers', async () => {
        // Arrange
        logIn();
        fakeSync({ typeIndexes: [fakeTypeIndex([[Post, 'https://alice.example/blog/']])] });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
        });

        const post = await new Post({ title: 'Post' }).save('https://alice.example/blog/');

        await cloud.track(Post, { register: { singleton: true } });

        const { model: singletonPost } = useSingletonModel(Post);

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.registeredContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });
        expect(cloud.registeredInstanceUrls).toEqual({ Post: [] });

        await vi.waitFor(() => expect(singletonPost.value?.url).toEqual(post.url));
    });

    it('reads models from registered instances', async () => {
        // Arrange
        logIn();

        const registeredPost = await new Post({ title: 'Registered' }).save('https://alice.example/blog/');
        const unlistedPost = await new Post({ title: 'Unlisted' }).save('https://alice.example/drafts/');
        const post = await new Post({ title: 'Default' }).save('https://alice.example/posts/');
        const typeIndex = fakeTypeIndex();

        typeIndex.relatedRegistrations.related = [
            new TypeRegistration({
                forClass: Post.schema.rdfClasses.map((rdfClass) => rdfClass.value),
                instance: registeredPost.url,
            }),
        ];

        fakeSync({ typeIndexes: [typeIndex] });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            unlistedContainerUrls: { Post: ['https://alice.example/drafts/'] },
        });

        await cloud.track(Post, { register: true });

        const { models: posts } = useModels(Post);

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.registeredInstanceUrls).toEqual({ Post: [registeredPost.url] });

        await vi.waitFor(() =>
            expect(posts.value.map((model) => model.url).sort()).toEqual(
                [registeredPost.url, unlistedPost.url, post.url].sort(),
            ),
        );
    });

    it('reads singleton models that have not been registered yet', async () => {
        // Arrange
        logIn();

        const registeredPost = await new Post({ title: 'Registered' }).save('https://alice.example/blog/');
        const typeIndex = fakeTypeIndex();

        typeIndex.relatedRegistrations.related = [
            new TypeRegistration({
                forClass: Post.schema.rdfClasses.map((rdfClass) => rdfClass.value),
                instance: registeredPost.url,
            }),
        ];

        fakeSync({ typeIndexes: [typeIndex] });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            autoPush: false,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            registeredInstanceUrls: { Post: [registeredPost.url] },
        });

        await cloud.track(Post, { register: { singleton: true } });

        const { models: posts } = useModels(Post);
        const post = await new Post({ title: 'Post' }).save('https://alice.example/posts/');

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.registeredInstanceUrls).toEqual({ Post: [registeredPost.url] });

        await vi.waitFor(() =>
            expect(posts.value.map((model) => model.url).sort()).toEqual([registeredPost.url, post.url].sort()),
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

    it('reads models created in unlisted containers', async () => {
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
        expect(cloud.unlistedContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });
        expect(posts.value.map((model) => model.url)).toEqual([post.url]);
    });

    it('ignores containers of models created in registered instances', async () => {
        // Arrange
        const post = new Post({ title: 'Registered' });
        const instanceUrl = post.mintUrl({ containerUrl: 'https://alice.example/blog/' });

        cloud.setState({
            ready: true,
            autoPush: false,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            registeredInstanceUrls: { Post: [instanceUrl] },
        });

        await cloud.track(Post, { register: { singleton: true } });

        // Act
        await post.save();

        // Assert
        expect(cloud.unlistedContainerUrls).toEqual({});
    });

    it('reads models from unlisted containers before syncing', async () => {
        // Arrange
        cloud.setState({
            ready: true,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            unlistedContainerUrls: { Post: ['https://alice.example/blog/'] },
        });

        const blogPost = await new Post({ title: 'Blog' }).save('https://alice.example/blog/');

        await cloud.track(Post, { register: true });

        // Act
        const { models: posts } = useModels(Post);

        // Assert
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([blogPost.url]));
    });

    it('forgets unlisted containers once they are registered', async () => {
        // Arrange
        logIn();
        fakeSync({ typeIndexes: [fakeTypeIndex([[Post, 'https://alice.example/blog/']])] });

        cloud.setState({
            ready: true,
            status: CloudStatus.Online,
            defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            unlistedContainerUrls: { Post: ['https://alice.example/blog/'] },
        });

        await cloud.track(Post, { register: true });

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.registeredContainerUrls).toEqual({ Post: ['https://alice.example/blog/'] });
        expect(cloud.unlistedContainerUrls).toEqual({ Post: [] });
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
        await cloud.track(PostsCollection, { register: { singleton: true } });

        // Act
        const config = await cloud.getSyncConfig();

        // Assert
        expect(config.userProfile).toEqual(user);
        expect(config.applicationModels).toEqual(
            expect.arrayContaining([
                { model: Post, registration: { path: undefined, public: true, mode: 'container' } },
                { model: PostsCollection, registration: { path: undefined, public: undefined, mode: 'instance' } },
            ]),
        );
    });

    describe('external sources', () => {
        const source: ExternalSource = { containerUrl: 'https://bob.example/posts/', models: [Post] };

        it('passes external sources to sync', async () => {
            // Arrange
            logIn();

            await cloud.track(Post, { register: true });
            cloud.addExternalSource(source);

            // Act
            const config = await cloud.getSyncConfig();

            // Assert
            expect(config.externalSources).toEqual([source]);
        });

        it('adds external sources once', () => {
            // Act
            cloud.addExternalSource(source);
            cloud.addExternalSource({ ...source });

            // Assert
            expect(cloud.getExternalSources()).toEqual([source]);
            expect(cloud.hasExternalSource(source)).toBe(true);
        });

        it('serializes external sources', () => {
            // Arrange
            const instanceSource: ExternalSource = { instanceUrl: 'https://bob.example/profile#it', models: [Post] };

            cloud.addExternalSource(source);
            cloud.addExternalSource(instanceSource);

            // Act
            const storage = cloud.serializePersistedState({ externalSources: cloud.externalSources });
            const restored = cloud.deserializePersistedState(storage);

            // Assert
            expect(storage).toEqual({
                externalSources: [
                    { containerUrl: source.containerUrl, modelNames: ['Post'] },
                    { instanceUrl: instanceSource.instanceUrl, modelNames: ['Post'] },
                ],
            });
            expect(restored).toEqual({ externalSources: [source, instanceSource] });
        });

        it('fails adding external sources with models that are not booted', () => {
            // Arrange
            const UnbootedPost = class extends Post {};

            // Act & Assert
            expect(() => cloud.addExternalSource({ ...source, models: [UnbootedPost] })).toThrow(/class isn't booted/);
            expect(cloud.externalSources).toEqual([]);
        });

        it('drops external sources with unknown models when restoring', () => {
            // Arrange
            const report = vi.spyOn(Errors.requireInstance(), 'report').mockResolvedValue();

            // Act
            const restored = cloud.deserializePersistedState({
                externalSources: [
                    { containerUrl: source.containerUrl, modelNames: ['Post'] },
                    { containerUrl: 'https://carol.example/notes/', modelNames: ['Note'] },
                ],
            });

            // Assert
            expect(restored).toEqual({ externalSources: [source] });
            expect(report).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('https://carol.example/notes/') }),
            );
        });

        it('forwards external source errors', async () => {
            // Arrange
            const error = new Error('Forbidden');
            const listener = vi.fn();

            logIn();
            fakeSync({ failedExternalSources: [[source, error]] });
            Events.on('cloud:sync-external-source-failed', listener);

            cloud.setState({ ready: true, status: CloudStatus.Online });

            cloud.addExternalSource(source);

            // Act
            await cloud.sync();

            // Assert
            expect(listener).toHaveBeenCalledWith({ source, error });
        });

        it('does not track containers of models created in external sources', async () => {
            // Arrange
            cloud.setState({
                ready: true,
                autoPush: false,
                defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            });

            await cloud.track(Post, { register: true });
            cloud.addExternalSource(source);

            // Act
            await new Post({ title: 'Managed' }).save(source.containerUrl);

            // Assert
            expect(cloud.unlistedContainerUrls).toEqual({});
            expect(Object.keys(cloud.localModelUpdates)).toHaveLength(1);
        });

        it('removes external sources discarding unsynced changes', async () => {
            // Arrange
            cloud.setState({
                ready: true,
                autoPush: false,
                defaultContainerUrls: { Post: 'https://alice.example/posts/' },
            });

            await cloud.track(Post, { register: true });
            cloud.addExternalSource(source);

            const ownPost = await Post.create({ title: 'Mine' });
            const externalPost = await new Post({ title: 'Managed' }).save(source.containerUrl);

            // Act
            await cloud.removeExternalSource(source);

            // Assert
            await expect(requireEngine().readDocumentIfExists(externalPost.requireDocumentUrl())).resolves.toBeNull();
            await expect(requireEngine().readDocumentIfExists(ownPost.requireDocumentUrl())).resolves.not.toBeNull();
            expect(Object.keys(cloud.localModelUpdates)).toEqual([ownPost.url]);
            expect(cloud.getExternalSources()).toEqual([]);
        });

        it('removes external sources without local documents', async () => {
            // Arrange
            const otherSource: ExternalSource = { containerUrl: 'https://carol.example/posts/', models: [Post] };

            cloud.setState({ ready: true, autoPush: false });
            cloud.addExternalSource(source);
            cloud.addExternalSource(otherSource);

            // Act
            await cloud.removeExternalSource(otherSource);

            // Assert
            expect(cloud.getExternalSources()).toEqual([source]);
        });

        it('removes external sources after running syncs', async () => {
            // Arrange
            let pulledPost: Post | null = null;
            let resumeSync!: () => void;
            const syncPaused = new Promise<void>((resolve) => (resumeSync = resolve));

            logIn();
            fakeSync({
                onRun: async () => {
                    await syncPaused;

                    pulledPost = await new Post({ title: 'Pulled' }).save(source.containerUrl);
                },
            });

            cloud.setState({ ready: true, autoPush: false, status: CloudStatus.Online });

            await cloud.track(Post, { register: true });
            cloud.addExternalSource(source);

            // Act
            const syncing = cloud.sync({ syncDirty: false });
            const removing = cloud.removeExternalSource(source);

            await after({ milliseconds: 10 });

            resumeSync();

            await Promise.all([syncing, removing]);

            // Assert
            expect(pulledPost).not.toBeNull();
            await expect(
                requireEngine().readDocumentIfExists((pulledPost as unknown as Post).requireDocumentUrl()),
            ).resolves.toBeNull();
            expect(cloud.localModelUpdates).toEqual({});
            expect(cloud.getExternalSources()).toEqual([]);
        });
    });
});
