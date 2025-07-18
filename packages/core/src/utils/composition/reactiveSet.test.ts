import { describe, expect, it } from 'vitest';
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

});
