import { PromisedValue, facade, tap } from '@noeldemartin/utils';

import Service from '@aerogel/core/services/Service';

export class CacheService extends Service {

    private cache?: PromisedValue<Cache> = undefined;

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
        return (this.cache =
            this.cache ??
            tap(new PromisedValue<Cache>(), (cache) => {
                caches.open('app').then((instance) => cache.resolve(instance));
            }));
    }

}

export default facade(CacheService);
