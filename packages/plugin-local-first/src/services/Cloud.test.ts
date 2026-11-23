import { Errors, Events, UI } from '@aerogel/core';
import type { ConflictHandler, DocumentConflict } from '@aerogel/plugin-local-first/services/Cloud';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import {
    connect,
    fakeSync,
    fakeTypeIndex,
    invadedCloud,
    logIn,
} from '@aerogel/plugin-local-first/services/testing/helpers';
import type { InvadedCloud } from '@aerogel/plugin-local-first/services/testing/helpers';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { useModels } from '@aerogel/reactivity';
import { SolidDocument } from '@noeldemartin/solid-utils';
import { Sync, requireEngine } from 'soukai-bis';
import type { DeletionConflict, ExternalSource, ModelContainerUrls } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

describe('Cloud', () => {
    let cloud: InvadedCloud;

    beforeEach(() => (cloud = invadedCloud()));

    it('loads registered collections with their depth', async () => {
        // Arrange
        const post = await new Post({ title: 'Nested' }).save({ containerUrl: `${Post.defaultContainerUrl}nested/` });

        await cloud.track(Post, { register: { depth: 1 } });

        // Act
        const { models: posts } = useModels(Post);

        // Assert
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });

    it('reads models from saved containers while logged out', async () => {
        // Arrange
        const post = await new Post({ title: 'Saved' }).save({ containerUrl: 'https://alice.example/blog/' });

        cloud.setState({
            ready: true,
            containerUrls: { Post: modelContainerUrls('https://alice.example/blog/') },
        });

        // Act
        await cloud.track(Post, { register: true });

        // Assert
        const { models: posts } = useModels(Post);

        expect(Post.defaultContainerUrl).toEqual('https://alice.example/blog/');
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });

    it('applies saved discovery containers before getting ready', async () => {
        // Arrange
        const defaultContainerUrl = Post.defaultContainerUrl;
        const post = await new Post({ title: 'Saved' }).save({ containerUrl: 'https://alice.example/blog/' });

        cloud.setState({
            ready: false,
            containerUrls: { Post: modelContainerUrls('https://alice.example/blog/') },
        });

        // Act
        await cloud.track(Post, { register: true });

        // Assert
        const { models: posts } = useModels(Post);

        expect(Post.defaultContainerUrl).toEqual(defaultContainerUrl);
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });

    it('does not get ready again when connecting', async () => {
        // Arrange
        const onReady = vi.fn();

        Events.on('cloud:ready', onReady);

        // Act
        await connect(cloud, { ready: true });

        // Assert
        expect(cloud.ready).toBe(true);
        expect(onReady).not.toHaveBeenCalled();
    });

    it('gets ready after setup', async () => {
        // Arrange
        const onReady = vi.fn(() => cloud.ready);

        fakeSync();
        Events.on('cloud:ready', onReady);

        await cloud.track(Post, { register: true });
        await Post.create({ title: 'Offline' });
        await connect(cloud, { ready: false });

        // Act
        await cloud.setup();

        // Assert
        expect(onReady).toHaveBeenCalledOnce();
        expect(onReady).toHaveReturnedWith(true);
        expect(cloud.ready).toBe(true);
        expect(cloud.status).toEqual(CloudStatus.Online);
    });

    it('reads models from containers registered during sync', async () => {
        // Arrange
        fakeSync({ typeIndexes: [fakeTypeIndex([[Post, 'https://alice.example/blog/']])] });

        const post = await new Post({ title: 'Elsewhere' }).save({ containerUrl: 'https://alice.example/blog/' });

        await cloud.track(Post, { register: true });
        await connect(cloud, {
            containerUrls: { Post: modelContainerUrls('https://alice.example/posts/') },
        });

        const { models: posts } = useModels(Post);

        await vi.waitFor(() => expect(posts.value).toEqual([]));

        // Act
        await cloud.sync();

        // Assert
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });

    it('configures type index registrations', async () => {
        // Arrange
        const connectSync = vi.spyOn(Sync.requireInstance(), 'connect');

        await cloud.track(Post, { register: { public: true } });
        await cloud.track(PostsCollection, { register: { singleton: true } });

        // Act
        await connect(cloud);

        // Assert
        expect(connectSync).toHaveBeenCalledWith(
            expect.objectContaining({
                models: [
                    {
                        model: Post,
                        files: undefined,
                        registration: { path: undefined, public: true, mode: 'container' },
                    },
                    {
                        model: PostsCollection,
                        files: undefined,
                        registration: { path: undefined, public: undefined, mode: 'instance' },
                    },
                ],
            }),
        );
    });

    it('asks how to resolve deletion conflicts', async () => {
        // Arrange
        logIn();

        await cloud.track(Post, { register: true });

        const deletionConflict = await createDeletionConflict();
        const modal = vi
            .spyOn(UI.requireInstance(), 'modal')
            .mockResolvedValue({ dismissed: false, response: 'restore' } as { dismissed: boolean });

        // Act
        const resolution = await cloud.resolveDeletionConflict(deletionConflict);

        // Assert
        const [component, props] = modal.mock.calls[0] ?? [];
        const { conflict } = props as { conflict?: DeletionConflict };

        expect(resolution).toEqual('restore');
        expect(component).toMatchObject({ __name: 'DeletionConflictModal' });
        expect(props).toMatchObject({
            conflict: { type: 'deleted-remotely', resourceUrl: deletionConflict.resourceUrl },
        });
        expect(conflict?.model?.url).toEqual(deletionConflict.resourceUrl);
    });

    it('prompts deletion conflicts with conflict handlers', async () => {
        // Arrange
        logIn();

        await cloud.track(Post, { register: true });

        const deletionConflict = await createDeletionConflict();
        const modal = vi
            .spyOn(UI.requireInstance(), 'modal')
            .mockResolvedValue({ dismissed: false, response: 'delete' } as { dismissed: boolean });

        cloud.conflictHandler = (conflict) =>
            conflict.resourceType === 'document'
                ? {
                      title: 'Post deleted',
                      message: `*${(conflict.model as Post).title}* was deleted on another device.`,
                      restoreText: 'Keep it',
                  }
                : undefined;

        // Act
        const resolution = await cloud.resolveDeletionConflict(deletionConflict);

        // Assert
        const [, props] = modal.mock.calls[0] ?? [];

        expect(resolution).toEqual('delete');
        expect(props).toMatchObject({
            prompt: {
                title: 'Post deleted',
                message: '*Hello World* was deleted on another device.',
                restoreText: 'Keep it',
            },
        });
    });

    it('resolves deletion conflicts with conflict handlers', async () => {
        // Arrange
        logIn();

        await cloud.track(Post, { register: true });

        const deletionConflict = await createDeletionConflict();
        const modal = vi.spyOn(UI.requireInstance(), 'modal');
        const handler = vi.fn<ConflictHandler>(async () => 'restore' as const);

        cloud.conflictHandler = handler;

        // Act
        const resolution = await cloud.resolveDeletionConflict(deletionConflict);

        // Assert
        const [conflict] = handler.mock.calls[0] ?? [];

        expect(resolution).toEqual('restore');
        expect(modal).not.toHaveBeenCalled();
        expect(conflict).toMatchObject({
            resourceType: 'document',
            type: 'deleted-remotely',
            resourceUrl: deletionConflict.resourceUrl,
        });
        expect((conflict as DocumentConflict | undefined)?.model?.url).toEqual(deletionConflict.resourceUrl);
    });

    it('clears sync state when logging out', async () => {
        // Arrange
        await connect(cloud, {
            containerUrls: { Post: modelContainerUrls('https://alice.example/posts/') },
        });

        // Act
        await cloud.logout();

        // Assert
        expect(cloud.ready).toBe(false);
        expect(cloud.containerUrls).toEqual({});
        expect(cloud.externalSources).toEqual([]);
        expect(cloud.status).toEqual(CloudStatus.Disconnected);
    });

    it('manages external sources when disconnected', async () => {
        // Arrange
        const source: ExternalSource = { containerUrl: 'https://bob.example/posts/', models: [Post] };
        const post = await new Post({ title: 'Shared' }).save({ containerUrl: source.containerUrl });

        cloud.addExternalSource(source);

        const addedSources = cloud.externalSources;
        const isInSource = cloud.isInExternalSource(post.requireUrl());

        // Act
        await cloud.removeExternalSource(source);

        // Assert
        expect(addedSources).toEqual([source]);
        expect(isInSource).toBe(true);
        expect(cloud.externalSources).toEqual([]);
        await expect(requireEngine().readDocumentIfExists(post.requireDocumentUrl())).resolves.toBeNull();
    });

    it('logs in while previous sessions are disconnecting', async () => {
        // Arrange
        let resumeSync!: () => void;
        let jobStarted!: () => void;
        const syncPaused = new Promise<void>((resolve) => (resumeSync = resolve));
        const syncStarted = new Promise<void>((resolve) => (jobStarted = resolve));

        fakeSync({
            onRun: () => {
                jobStarted();

                return syncPaused;
            },
        });

        await connect(cloud);

        const previousSession = Sync.session;
        const syncing = cloud.sync();

        await syncStarted;

        const disconnected = previousSession?.disconnect();

        // Act
        const loggingIn = cloud.login();

        resumeSync();

        await Promise.all([syncing, disconnected, loggingIn]);

        // Assert
        expect(Sync.session).not.toBe(previousSession);
        expect(Sync.session?.isActive()).toBe(true);
        expect(cloud.status).toEqual(CloudStatus.Online);
    });

    it('clears sync errors when disconnecting', async () => {
        // Arrange
        fakeSync({ error: new Error('Sync failed') });

        await connect(cloud);
        await expect(cloud.sync()).rejects.toThrow('Sync failed');

        // Act
        await Sync.session?.disconnect();

        // Assert
        expect(cloud.syncError).toBeNull();
    });

    it('mirrors sync properties', async () => {
        // Arrange
        const source: ExternalSource = { containerUrl: 'https://bob.example/posts/', models: [Post] };

        await connect(cloud);

        // Act
        cloud.addExternalSource(source);

        // Assert
        await vi.waitFor(() => expect(cloud.externalSources).toEqual([source]));
    });

    it('serializes external sources', () => {
        // Arrange
        const source: ExternalSource = { containerUrl: 'https://bob.example/posts/', models: [Post] };

        // Act
        const storage = cloud.serializePersistedState({ externalSources: [source] });
        const restored = cloud.deserializePersistedState(storage);

        // Assert
        expect(storage).toEqual({ externalSources: [{ containerUrl: source.containerUrl, modelNames: ['Post'] }] });
        expect(restored).toEqual({ externalSources: [source] });
    });

    it('drops external sources with unknown models when restoring', () => {
        // Arrange
        const report = vi.spyOn(Errors.requireInstance(), 'report').mockResolvedValue();

        // Act
        const restored = cloud.deserializePersistedState({
            externalSources: [
                { containerUrl: 'https://bob.example/posts/', modelNames: ['Post'] },
                { containerUrl: 'https://carol.example/notes/', modelNames: ['Note'] },
            ],
        });

        // Assert
        expect(restored).toEqual({ externalSources: [{ containerUrl: 'https://bob.example/posts/', models: [Post] }] });
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('https://carol.example/notes/') }),
        );
    });

    it('reports registration errors after successful syncs', async () => {
        // Arrange
        const report = vi.spyOn(Errors.requireInstance(), 'report').mockResolvedValue();

        fakeSync({ failedRegistrations: [Post] });

        await connect(cloud);

        // Act
        await cloud.sync();

        // Assert
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Registration failed' }),
            expect.stringContaining('could not be registered'),
        );
    });

    it('does not report registration errors after failed syncs', async () => {
        // Arrange
        const report = vi.spyOn(Errors.requireInstance(), 'report').mockResolvedValue();

        fakeSync({ failedRegistrations: [Post], error: new Error('Sync failed') });

        await connect(cloud);

        // Act
        await expect(cloud.sync()).rejects.toThrow('Sync failed');

        // Assert
        expect(report).not.toHaveBeenCalled();
    });

    it('forwards external source errors', async () => {
        // Arrange
        const source: ExternalSource = { containerUrl: 'https://bob.example/posts/', models: [Post] };
        const error = new Error('Forbidden');
        const listener = vi.fn();

        fakeSync({ failedExternalSources: [[source, error]] });
        Events.on('cloud:sync-external-source-failed', listener);

        await connect(cloud);

        cloud.addExternalSource(source);

        // Act
        await cloud.sync();

        // Assert
        expect(listener).toHaveBeenCalledWith({ source, error });
    });

    function modelContainerUrls(defaultContainerUrl: string): ModelContainerUrls {
        return { default: defaultContainerUrl, registered: [], unlisted: [], instances: [] };
    }

    async function createDeletionConflict(): Promise<DeletionConflict> {
        const post = await Post.create({ title: 'Hello World' });
        const localDocument = await requireEngine().readDocument(post.requireDocumentUrl());

        return {
            type: 'deleted-remotely',
            resourceUrl: post.requireUrl(),
            localDocument,
            remoteDocument: new SolidDocument(localDocument.url, []),
            model: post,
        };
    }
});
