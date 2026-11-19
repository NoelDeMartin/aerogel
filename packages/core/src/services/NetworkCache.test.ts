import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import Events from './Events';
import { NetworkCacheService } from './NetworkCache';

class FakeCache {
    public responses = new Map<string, Response>();

    public async match(url: string): Promise<Response | undefined> {
        return this.responses.get(url);
    }

    public async put(url: string, response: Response): Promise<void> {
        this.responses.set(url, response);
    }

    public async keys(url?: string): Promise<string[]> {
        return Array.from(this.responses.keys()).filter((key) => !url || key === url);
    }

    public async delete(url: string): Promise<boolean> {
        return this.responses.delete(url);
    }
}

describe('NetworkCache', () => {
    let fakeCaches: Map<string, FakeCache>;
    let networkCache: NetworkCacheService;

    beforeEach(async () => {
        fakeCaches = new Map();

        vi.unstubAllGlobals();
        vi.stubGlobal('caches', {
            open: async (name: string) => fakeCaches.get(name) ?? fakeCaches.set(name, new FakeCache()).get(name),
            delete: async (name: string) => fakeCaches.delete(name),
        });

        Events.reset();

        networkCache = new NetworkCacheService();

        await networkCache.launch();
    });

    it('stores and deletes responses', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        await networkCache.store(url, new Response('avatar'));

        // Act
        const cachedResponse = await networkCache.get(url);

        await networkCache.delete(url);

        // Assert
        expect(await cachedResponse?.text()).toEqual('avatar');
        expect(await networkCache.get(url)).toBeNull();
    });

    it('clears responses when the cache is cleared', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        await networkCache.store(url, new Response('avatar'));

        // Act
        await Events.emit('clear-cache');

        // Assert
        expect(fakeCaches.size).toEqual(0);
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

    it('ignores the cache when it is not available', async () => {
        // Arrange
        const url = 'https://alice.example/avatar.png';

        vi.stubGlobal('caches', undefined);

        networkCache = new NetworkCacheService();

        await networkCache.launch();

        // Act
        await networkCache.store(url, new Response('avatar'));
        await networkCache.delete(url);

        // Assert
        expect(await networkCache.get(url)).toBeNull();
    });
});
