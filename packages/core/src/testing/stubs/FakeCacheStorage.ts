import FakeCache from '@aerogel/core/testing/stubs/FakeCache';

export default class FakeCacheStorage {
    public caches = new Map<string, FakeCache>();

    public async open(name: string): Promise<FakeCache> {
        const cache = this.caches.get(name) ?? new FakeCache();

        this.caches.set(name, cache);

        return cache;
    }

    public async keys(): Promise<string[]> {
        return Array.from(this.caches.keys());
    }

    public async delete(name: string): Promise<boolean> {
        return this.caches.delete(name);
    }
}
