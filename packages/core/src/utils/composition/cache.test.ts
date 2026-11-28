import 'fake-indexeddb/auto';
import Cache from '@aerogel/core/services/Cache';
import { HOUR_MILLISECONDS, after } from '@noeldemartin/utils';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { effectScope } from 'vue';
import type { Ref } from 'vue';

import { useCache } from './cache';

describe('useCache', () => {
    beforeEach(async () => {
        vi.useRealTimers();

        await Cache.clear();
    });

    it('reads cached values', async () => {
        // Arrange
        await Cache.set('foo', 'bar');

        // Act
        const { value, ready } = useCache<string>('foo');

        await untilReady(ready);

        // Assert
        expect(value.value).toEqual('bar');
    });

    it('uses default values', async () => {
        // Act
        const { value, ready } = useCache('foo', { defaultValue: 'default' });

        await untilReady(ready);

        // Assert
        expect(value.value).toEqual('default');
        expectTypeOf(value.value).toEqualTypeOf<string>();
    });

    it('stores assigned values', async () => {
        // Arrange
        const { value } = useCache<{ foo: string }>('foo');

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

        const { value, ready } = useCache<string>('foo');

        await untilReady(ready);

        // Act
        value.value = undefined;

        await after();

        // Assert
        expect(value.value).toBeUndefined();
        expect(await Cache.get('foo')).toBeUndefined();
    });

    it('detects stale values', async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });

        const { stale, ready } = useCache<string>('foo', { maxAge: HOUR_MILLISECONDS });

        // Act & Assert - Loading
        expect(stale.value).toBe(false);

        await untilReady(ready);

        // Act & Assert - Missing
        expect(stale.value).toBe(true);

        // Act & Assert - Fresh
        await Cache.set('foo', 'bar');
        expect(stale.value).toBe(false);

        // Act & Assert - Expired
        vi.advanceTimersByTime(HOUR_MILLISECONDS + 1);
        expect(stale.value).toBe(true);
    });

    it('never expires values without max age', async () => {
        // Arrange
        await Cache.set('foo', 'bar');

        // Act
        const { stale, ready } = useCache<string>('foo');

        await untilReady(ready);

        // Assert
        expect(stale.value).toBe(false);
    });

    it('reacts to cache changes', async () => {
        // Arrange
        const { value, ready } = useCache('foo', { defaultValue: 'default' });
        const { value: other } = useCache<string>('other');

        await untilReady(ready);

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
        const cache = scope.run(() => useCache<string>('foo'));

        await untilReady(cache?.ready);

        // Act
        scope.stop();

        await Cache.set('foo', 'bar');

        // Assert
        expect(cache?.value.value).toBeUndefined();
    });

    async function untilReady(ready?: Readonly<Ref<boolean>>): Promise<void> {
        await vi.waitFor(() => expect(ready?.value).toBe(true));
    }
});
