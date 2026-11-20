import { Events, NetworkCache, UI } from '@aerogel/core';
import type { CloudFiles, ConflictHandler } from '@aerogel/plugin-local-first/services/Cloud';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import { fakeSync, invadedCloud, logIn } from '@aerogel/plugin-local-first/services/testing/helpers';
import type { InvadedCloud } from '@aerogel/plugin-local-first/services/testing/helpers';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import { bootModels, FilesStrategies, requireLocalEngine } from 'soukai-bis';
import type { FileConflict, SyncFilesConfig } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

describe('Cloud files', () => {
    let cloud: InvadedCloud;

    beforeEach(() => (cloud = invadedCloud()));

    it('asks how to resolve file conflicts', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';
        const conflict: FileConflict = {
            type: 'modified-remotely',
            url,
            localFile: { url, containerUrl: 'https://alice.example/posts/' },
            remoteUpdatedAt: new Date(),
        };
        const modal = vi
            .spyOn(UI.requireInstance(), 'modal')
            .mockResolvedValue({ dismissed: false, response: 'keep-remote' } as { dismissed: boolean });

        logIn();

        const config = await cloud.getSyncConfig();

        // Act
        const resolution = await config.resolveFileConflict?.(conflict);

        // Assert
        const [component, props] = modal.mock.calls[0] ?? [];

        expect(resolution).toEqual('keep-remote');
        expect(component).toMatchObject({ __name: 'FileConflictModal' });
        expect(props).toMatchObject({ conflict: { type: 'modified-remotely', url } });
    });

    it('resolves file conflicts with conflict handlers', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';
        const modal = vi.spyOn(UI.requireInstance(), 'modal');
        const handler = vi.fn<ConflictHandler>(async () => 'keep-local' as const);

        logIn();

        const config = await cloud.getSyncConfig();

        cloud.conflictHandler = handler;

        // Act
        const resolution = await config.resolveFileConflict?.({
            type: 'deleted-remotely',
            url,
            localFile: { url, containerUrl: 'https://alice.example/posts/' },
            remoteUpdatedAt: null,
        });

        // Assert
        expect(resolution).toEqual('keep-local');
        expect(modal).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({ resourceType: 'file', type: 'deleted-remotely', url }),
        );
    });

    it.each<[CloudFiles, SyncFilesConfig[]]>([
        [true, [{ strategy: 'container' }]],
        [FilesStrategies.Container, [{ strategy: 'container' }]],
        [
            { fields: ['coverUrl'], availableOffline: true },
            [{ strategy: 'document', fields: ['coverUrl'], availableOffline: true }],
        ],
        [
            [{ availableOffline: true }, { strategy: 'document', fields: ['imageUrl'] }],
            [
                { strategy: 'container', availableOffline: true },
                { strategy: 'document', fields: ['imageUrl'] },
            ],
        ],
    ])('configures files in sync config (%j)', async (files, expectedFiles) => {
        // Arrange
        class PostWithFiles extends Post {
            public static override cloud = { files };
        }

        logIn();
        bootModels({ PostWithFiles });

        await cloud.track(PostWithFiles, { register: true });

        // Act
        const config = await cloud.getSyncConfig();

        // Assert
        expect(config.applicationModels).toEqual(
            expect.arrayContaining([expect.objectContaining({ model: PostWithFiles, files: expectedFiles })]),
        );
    });

    it('configures files from registration options', async () => {
        // Arrange
        logIn();

        await cloud.track(Post, { register: { files: { fields: ['coverUrl'] } } });

        // Act
        const config = await cloud.getSyncConfig();

        // Assert
        expect(config.applicationModels).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ model: Post, files: [{ strategy: 'document', fields: ['coverUrl'] }] }),
            ]),
        );
    });

    it('caches pushed files', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';

        logIn();
        fakeSync(cloud, { pushedFiles: [{ url, blob: new Blob(['image'], { type: 'image/png' }) }] });
        cloud.setState({ ready: true, status: CloudStatus.Online });

        // Act
        await cloud.sync();

        // Assert
        const cachedResponse = await NetworkCache.get(url);

        expect(await cachedResponse?.text()).toEqual('image');
        expect(cachedResponse?.headers.get('Content-Type')).toEqual('image/png');
    });

    it('forgets cached files updated during sync', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';
        const updatedUrls: string[] = [];

        await NetworkCache.store(url, new Response('stale image'));

        logIn();
        fakeSync(cloud, { syncedFileUrls: [url] });
        cloud.setState({ ready: true, status: CloudStatus.Online });

        Events.on('solid:file-updated', ({ url: updatedUrl }) => updatedUrls.push(updatedUrl));

        // Act
        await cloud.sync();

        // Assert
        expect(await NetworkCache.get(url)).toBeNull();
        expect(updatedUrls).toEqual([url]);
    });

    it('forgets cached files when logging out during sync', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';

        await NetworkCache.store(url, new Response('stale image'));

        logIn();
        fakeSync(cloud, { syncedFileUrls: [url], onRun: () => cloud.logout() });
        cloud.setState({ ready: true, status: CloudStatus.Online });

        // Act
        await cloud.sync();

        // Assert
        expect(cloud.syncJob).toBeNull();
        expect(await NetworkCache.get(url)).toBeNull();
    });

    it('tracks local file changes', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';

        cloud.setState({ ready: true, autoPush: false, status: CloudStatus.Online });

        // Act
        await requireLocalEngine().writeFile(url, new Blob(['image']), {
            localChanges: () => ({ resources: { [url]: { createdAt: new Date() } } }),
        });
        await cloud.refreshLocalChanges();

        // Assert
        expect(cloud.localChanges).toBe(1);
        expect(cloud.dirty).toBe(true);
    });

    it('forgets local file changes that were discarded', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';

        cloud.setState({ ready: true, autoPush: false, status: CloudStatus.Online });

        await requireLocalEngine().writeFile(url, new Blob(['image']), {
            localChanges: () => ({ resources: { [url]: { createdAt: new Date() } } }),
        });
        await cloud.refreshLocalChanges();

        expect(cloud.localChanges).toBe(1);

        // Act
        await requireLocalEngine().deleteFile(url);
        await cloud.refreshLocalChanges();

        // Assert
        expect(cloud.localChanges).toBe(0);
        expect(cloud.dirty).toBe(false);
    });
});
