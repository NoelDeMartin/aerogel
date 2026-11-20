import Events from '@aerogel/core/services/Events';
import Service from '@aerogel/core/services/Service';
import { appNamespace } from '@aerogel/core/utils/app';
import { facade, silenced } from '@noeldemartin/utils';

export class NetworkCacheService extends Service {
    private cache?: Promise<Cache | null> = undefined;

    public async get(url: string): Promise<Response | null> {
        const cache = await this.open();

        if (!cache) {
            return null;
        }

        return (await silenced(cache.match(url))) ?? null;
    }

    public async store(url: string, response: Response): Promise<void> {
        const cache = await this.open();

        if (!cache) {
            return;
        }

        await silenced(cache.put(url, response));
    }

    public async replace(url: string, response: Response): Promise<void> {
        const cache = await this.open();

        if (!cache) {
            return;
        }

        const keys = await silenced(cache.keys(url));

        if (!keys?.length) {
            return;
        }

        await silenced(cache.put(url, response));
    }

    public async delete(url: string): Promise<void> {
        const cache = await this.open();

        if (!cache) {
            return;
        }

        await silenced(cache.delete(url));
    }

    public async clear(): Promise<void> {
        this.cache = undefined;

        if (typeof caches === 'undefined') {
            return;
        }

        await silenced(caches.delete(this.getCacheName()));
    }

    protected override async boot(): Promise<void> {
        Events.on('clear-cache', () => this.clear());
        Events.on('purge-storage', () => this.clear());
    }

    protected getCacheName(): string {
        return `${appNamespace()}-network-cache`;
    }

    protected async open(): Promise<Cache | null> {
        if (typeof caches === 'undefined') {
            return null;
        }

        return (this.cache ??= caches.open(this.getCacheName()).catch(() => null));
    }
}

export default facade(NetworkCacheService);
