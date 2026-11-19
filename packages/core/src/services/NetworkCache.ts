import Service from '@aerogel/core/services/Service';
import { facade } from '@noeldemartin/utils';

export class NetworkCacheService extends Service {
    private cache?: Promise<Cache> = undefined;

    public async get(url: string): Promise<Response | null> {
        const cache = await this.open();
        const response = await cache.match(url);

        return response ?? null;
    }

    public async store(url: string, response: Response): Promise<void> {
        const cache = await this.open();

        await cache.put(url, response);
    }

    public async replace(url: string, response: Response): Promise<void> {
        const cache = await this.open();
        const keys = await cache.keys(url);

        if (keys.length === 0) {
            return;
        }

        await cache.put(url, response);
    }

    protected async open(): Promise<Cache> {
        return (this.cache ??= caches.open('app'));
    }
}

export default facade(NetworkCacheService);
