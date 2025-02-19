import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Storage } from '@noeldemartin/utils';

import { persistent } from './persistent';

describe('Vue persistent helper', () => {

    it('serializes to localStorage', async () => {
        // Arrange
        const store = persistent<{ foo?: string }>('foobar', {});

        // Act
        store.foo = 'bar';

        await nextTick();

        // Assert
        expect(Storage.get('foobar')).toEqual({ foo: 'bar' });
    });

    it('reads from localStorage', async () => {
        // Arrange
        Storage.set('foobar', { foo: 'bar' });

        // Act
        const store = persistent<{ foo?: string }>('foobar', {});

        // Assert
        expect(store.foo).toEqual('bar');
    });

});
