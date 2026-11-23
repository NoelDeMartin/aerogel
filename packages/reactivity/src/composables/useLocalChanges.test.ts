import { useLocalChanges } from '@aerogel/reactivity/composables/useLocalChanges';
import Post from '@aerogel/reactivity/testing/stubs/models/Post';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import { trackLocalChanges } from 'soukai-bis';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('useLocalChanges', () => {
    it('Counts local changes', async () => {
        // Arrange
        trackLocalChanges(User);

        const { count, dirty } = useLocalChanges();

        // Act
        await User.create({ name: 'Alice', age: 23 });

        // Assert
        await vi.waitFor(() => expect(count.value).toBe(1));
        expect(dirty.value).toBe(true);
    });

    it('Ignores changes in models without tracking', async () => {
        // Arrange
        trackLocalChanges(User);

        const { count, dirty } = useLocalChanges();

        // Act
        await Post.create({ title: 'Hello World' });

        // Assert
        await vi.waitFor(() => expect(count.value).toBe(0));
        expect(dirty.value).toBe(false);
    });
});
