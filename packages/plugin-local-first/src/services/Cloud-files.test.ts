import { Events, NetworkCache, UI } from '@aerogel/core';
import type { CloudFiles, ConflictHandler } from '@aerogel/plugin-local-first/services/Cloud';
import { connect, fakeSync, invadedCloud, logIn } from '@aerogel/plugin-local-first/services/testing/helpers';
import type { InvadedCloud } from '@aerogel/plugin-local-first/services/testing/helpers';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import { bootModels, FilesSyncStrategies } from 'soukai-bis';
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

        // Act
        const resolution = await cloud.resolveFileConflict(conflict);

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

        cloud.conflictHandler = handler;

        // Act
        const resolution = await cloud.resolveFileConflict({
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
        [FilesSyncStrategies.Container, [{ strategy: 'container' }]],
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

        bootModels({ PostWithFiles });

        // Act
        const syncModel = cloud.getSyncModel(PostWithFiles, true);

        // Assert
        expect(syncModel).toMatchObject({ model: PostWithFiles, files: expectedFiles });
    });

    it('configures files from registration options', async () => {
        // Act
        const syncModel = cloud.getSyncModel(Post, { files: { fields: ['coverUrl'] } });

        // Assert
        expect(syncModel).toMatchObject({ model: Post, files: [{ strategy: 'document', fields: ['coverUrl'] }] });
    });

    it('caches pushed files', async () => {
        // Arrange
        const url = 'https://alice.example/posts/image.png';

        fakeSync({ pushedFiles: [{ url, blob: new Blob(['image'], { type: 'image/png' }) }] });

        await connect(cloud);

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

        fakeSync({ syncedFileUrls: [url] });

        await connect(cloud);

        Events.on('solid:file-updated', ({ url: updatedUrl }) => updatedUrls.push(updatedUrl));

        // Act
        await cloud.sync();

        // Assert
        expect(await NetworkCache.get(url)).toBeNull();
        expect(updatedUrls).toEqual([url]);
    });
});
