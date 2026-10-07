import Events from '@aerogel/core/services/Events';
import Service from '@aerogel/core/services/Service';
import { appNamespace } from '@aerogel/core/utils/app';
import { IndexedDBMap, facade } from '@noeldemartin/utils';

export class CacheService extends Service {
    private storage: IndexedDBMap<unknown> | null = null;

    public async get<T>(key: string): Promise<T | undefined> {
        return (await this.getStorage().get(key)) as T | undefined;
    }

    public async set(key: string, value: unknown): Promise<void> {
        await this.getStorage().set(key, value);
    }

    public async clear(): Promise<void> {
        await Promise.all([this.getStorage().clear(), Events.emit('clear-cache')]);
    }

    protected override async boot(): Promise<void> {
        Events.on('purge-storage', () => this.getStorage().clear());
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
