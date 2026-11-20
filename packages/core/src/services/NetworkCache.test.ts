import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import Events from './Events';
import { NetworkCacheService } from './NetworkCache';

describe('NetworkCache', () => {
    let networkCache: NetworkCacheService;

    beforeEach(async () => {
        networkCache = new NetworkCacheService();

        await networkCache.launch();
    });

    it('stores responses', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        // Act
        await networkCache.store(url, new Response('avatar'));

        // Assert
        const cachedResponse = await networkCache.get(url);

        expect(await cachedResponse?.text()).toEqual('avatar');
    });

    it('deletes responses', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        await networkCache.store(url, new Response('avatar'));

        // Act
        await networkCache.delete(url);

        // Assert
        expect(await networkCache.get(url)).toBeNull();
    });

    it('clears responses when the cache is cleared', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        await networkCache.store(url, new Response('avatar'));

        // Act
        await Events.emit('clear-cache');

        // Assert
        expect(await caches.keys()).toEqual([]);
        expect(await networkCache.get(url)).toBeNull();
    });

    it('clears responses when storage is purged', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        await networkCache.store(url, new Response('avatar'));

        // Act
        await Events.emit('purge-storage');

        // Assert
        expect(await networkCache.get(url)).toBeNull();
    });

    it('ignores cache storage errors', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';
        const quotaExceeded = () => Promise.reject(new DOMException('Quota exceeded', 'QuotaExceededError'));

        vi.stubGlobal('caches', {
            open: async () => ({
                match: quotaExceeded,
                put: quotaExceeded,
                keys: quotaExceeded,
                delete: quotaExceeded,
            }),
            delete: quotaExceeded,
        });

        // Act
        await networkCache.store(url, new Response('avatar'));
        await networkCache.replace(url, new Response('avatar'));
        await networkCache.delete(url);
        await networkCache.clear();

        // Assert
        expect(await networkCache.get(url)).toBeNull();
    });
});
