import 'fake-indexeddb/auto';
import Cache from '@aerogel/core/services/Cache';
import { after } from '@noeldemartin/utils';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { effectScope } from 'vue';

import { useCache } from './cache';

describe('useCache', () => {
    beforeEach(() => Cache.clear());

    it('reads cached values', async () => {
        // Arrange
        await Cache.set('foo', 'bar');

        // Act
        const value = useCache<string>('foo');

        await value.ready;

        // Assert
        expect(value.value).toEqual('bar');
    });

    it('uses default values', async () => {
        // Act
        const value = useCache('foo', 'default');

        await value.ready;

        // Assert
        expect(value.value).toEqual('default');
    });

    it('stores assigned values', async () => {
        // Arrange
        const value = useCache<{ foo: string }>('foo');

        // Act
        value.value = { foo: 'bar' };

        await after();

        // Assert
        expect(value.value).toEqual({ foo: 'bar' });
        expect(await Cache.get('foo')).toEqual({ foo: 'bar' });
    });

    it('deletes undefined values', async () => {
        // Arrange
        await Cache.set('foo', 'bar');

        const value = useCache<string>('foo');

        await after();

        // Act
        value.value = undefined;

        await after();

        // Assert
        expect(value.value).toBeUndefined();
        expect(await Cache.get('foo')).toBeUndefined();
    });

    it('reacts to cache changes', async () => {
        // Arrange
        const value = useCache('foo', 'default');
        const other = useCache<string>('other');

        await after();

        // Act & Assert
        await Cache.set('foo', 'bar');
        expect(value.value).toEqual('bar');
        expect(other.value).toBeUndefined();

        await Cache.delete('foo');
        expect(value.value).toEqual('default');

        await Cache.set('foo', 'baz');
        await Cache.clear();
        expect(value.value).toEqual('default');
    });

    it('stops listening when the scope is disposed', async () => {
        // Arrange
        const scope = effectScope();
        const value = scope.run(() => useCache<string>('foo'));

        await after();

        // Act
        scope.stop();

        await Cache.set('foo', 'bar');

        // Assert
        expect(value?.value).toBeUndefined();
    });
});
