import type { ComputedModelsCache } from '@aerogel/reactivity/lib';
import { facade, IndexedDBMap } from '@noeldemartin/utils';

export class TestingComputedModelsCache implements ComputedModelsCache {
    private storage = new IndexedDBMap<unknown>('aerogel-reactivity-testing-cache');

    async get<T>(key: string): Promise<T | undefined> {
        return (await this.storage.get(key)) as T | undefined;
    }

    async set(key: string, value: unknown): Promise<void> {
        await this.storage.set(key, value);
    }

    async clear(): Promise<void> {
        await this.storage.clear();
    }
}

export default facade(TestingComputedModelsCache);
