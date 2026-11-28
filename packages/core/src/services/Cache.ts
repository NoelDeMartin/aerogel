import Events from '@aerogel/core/services/Events';
import Service from '@aerogel/core/services/Service';
import { appNamespace } from '@aerogel/core/utils/app';
import { IndexedDBMap, ListenersManager, facade } from '@noeldemartin/utils';
import type { Listeners } from '@noeldemartin/utils';

export interface CacheListener {
    onUpdated?(key: string, value: unknown): unknown;
    onDeleted?(key: string): unknown;
    onCleared?(): unknown;
}

export class CacheService extends Service {
    private storage: IndexedDBMap<unknown> | null = null;
    private cacheListeners = new ListenersManager<CacheListener>();

    public get listeners(): Listeners<CacheListener> {
        return this.cacheListeners;
    }

    public async get<T>(key: string): Promise<T | undefined> {
        return (await this.getStorage().get(key)) as T | undefined;
    }

    public async set(key: string, value: unknown): Promise<void> {
        await this.getStorage().set(key, value);
        await this.cacheListeners.emit('onUpdated', key, value);
    }

    public async delete(key: string): Promise<void> {
        await this.getStorage().delete(key);
        await this.cacheListeners.emit('onDeleted', key);
    }

    public async clear(): Promise<void> {
        await Promise.all([this.clearStorage(), Events.emit('clear-cache')]);
    }

    protected override async boot(): Promise<void> {
        Events.on('purge-storage', () => this.clearStorage());
    }

    private async clearStorage(): Promise<void> {
        await this.getStorage().clear();
        await this.cacheListeners.emit('onCleared');
    }

    private getStorage(): IndexedDBMap<unknown> {
        return (this.storage ??= new IndexedDBMap(`${appNamespace()}-cache`));
    }
}

export default facade(CacheService);

declare module '@aerogel/core/services/Events' {
    export interface EventsPayload {
        'clear-cache': void;
    }
}
