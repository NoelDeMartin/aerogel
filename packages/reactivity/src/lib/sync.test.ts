import { getTrackedModelsData, getTrackedUrls } from '@aerogel/reactivity/internals/tracking';
import { loadTrackedModels, resetModelsState } from '@aerogel/reactivity/lib/tracking';
import Post from '@aerogel/reactivity/testing/stubs/models/Post';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import { connectTestingSync } from '@aerogel/reactivity/testing/sync';
import { invade } from '@noeldemartin/utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

describe('Sync', () => {
    beforeEach(() => resetModelsState());

    it('Discovers models in synced containers', async () => {
        // Act
        const session = await connectTestingSync([{ model: Post, registration: true }]);

        // Assert
        expect(getTrackedUrls(Post)).toEqual([session.requireRemoteContainerUrl(Post)]);
    });

    it('Refreshes registered models after syncing', async () => {
        // Arrange
        await loadTrackedModels(Post);
        await loadTrackedModels(User);

        const session = await connectTestingSync([
            { model: Post, registration: true },
            { model: User, registration: false },
        ]);
        const refreshPosts = vi.spyOn(getTrackedModelsData(Post), 'refresh');
        const refreshUsers = vi.spyOn(getTrackedModelsData(User), 'refresh');

        // Act
        await invade(session, ['emit']).emit('onSyncCompleted', { cancelled: false, error: null });

        // Assert
        expect(refreshPosts).toHaveBeenCalledOnce();
        expect(refreshUsers).not.toHaveBeenCalled();
    });
});
