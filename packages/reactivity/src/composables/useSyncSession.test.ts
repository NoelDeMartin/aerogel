import { useSyncSession } from '@aerogel/reactivity/composables/useSyncSession';
import { resetReactiveState } from '@aerogel/reactivity/lib/tracking';
import Post from '@aerogel/reactivity/testing/stubs/models/Post';
import { bootTestingSync, connectTestingSync } from '@aerogel/reactivity/testing/sync';
import { Sync } from 'soukai-bis';
import { beforeEach, describe, expect, it } from 'vite-plus/test';

describe('useSyncSession', () => {
    beforeEach(() => resetReactiveState());

    it('Follows sync sessions', async () => {
        // Arrange
        const session = useSyncSession();

        // Act
        const syncSession = await connectTestingSync();

        const connected = session.connected;
        const online = session.online;
        const setupCompleted = session.setupCompleted;

        await syncSession.disconnect();

        // Assert
        expect(connected).toBe(true);
        expect(online).toBe(true);
        expect(setupCompleted).toBe(true);
        expect(session.connected).toBe(false);
        expect(session.setupCompleted).toBe(true);
    });

    it('Follows external sources without sessions', async () => {
        // Arrange
        const session = useSyncSession();
        const source = { containerUrl: 'https://bob.example/posts/', models: [Post] };

        await bootTestingSync(Post, { default: 'https://alice.example/posts/' });

        // Act
        await Sync.addExternalSource(source);

        // Assert
        expect(session.connected).toBe(false);
        expect(session.externalSources).toEqual([source]);
    });

    it('Reads sessions connected before using it', async () => {
        // Arrange
        await connectTestingSync();

        // Act
        const session = useSyncSession();

        // Assert
        expect(session.connected).toBe(true);
    });
});
