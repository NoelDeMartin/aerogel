import { Events, Service } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';

import { IndexedDBMap } from '@/services/IndexedDBMap';

export class DocumentsCacheService extends Service {

    private cache = new IndexedDBMap<{ modifiedAt: number }>('documents-cache');

    public async isFresh(documentUrl: string, modifiedAt: Date | number): Promise<boolean> {
        const meta = await this.cache.get(documentUrl);
        const modifiedAtTime = typeof modifiedAt !== 'number' ? modifiedAt.getTime() : modifiedAt;

        return !!meta?.modifiedAt && meta.modifiedAt >= modifiedAtTime;
    }

    public async remember(documentUrl: string, modifiedAt: Date | number): Promise<void> {
        await this.cache.set(documentUrl, {
            modifiedAt: typeof modifiedAt !== 'number' ? modifiedAt.getTime() : modifiedAt,
        });
    }

    public async forget(documentUrl: string): Promise<void> {
        await this.cache.delete(documentUrl);
    }

    protected async boot(): Promise<void> {
        Events.on('auth:logout', async () => {
            await this.cache.clear();

            this.cache.close();
        });
    }

}

export default facade(DocumentsCacheService);
