import { describe, expect, it } from 'vite-plus/test';
import { nextTick, watchEffect } from 'vue';

import { reactiveSet } from './reactiveSet';

describe('Vue reactiveSet', () => {
    it('watches updates', async () => {
        // Arrange
        const set = reactiveSet();
        let updates = 0;

        watchEffect(() => (set.has('foo'), updates++));

        // Act
        set.add('foo');
        await nextTick();

        set.add('bar');
        await nextTick();

        set.add('baz');
        await nextTick();

        set.reset();
        await nextTick();

        // Assert
        expect(updates).toEqual(5);
    });

    it('compares items by key', () => {
        // Arrange
        const set = reactiveSet<{ id: string; name: string }>(undefined, { key: (item) => item.id });
        const alice = { id: 'alice', name: 'Alice' };
        const otherAlice = { id: 'alice', name: 'Alice (other instance)' };
        const bob = { id: 'bob', name: 'Bob' };

        // Act
        set.add(alice);
        set.add(otherAlice);
        set.add(bob);
        set.delete({ ...bob });

        // Assert
        expect(set.values()).toEqual([alice]);
        expect(set.has(otherAlice)).toBe(true);
        expect(set.has(bob)).toBe(false);
    });
});
