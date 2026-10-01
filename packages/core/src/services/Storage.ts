import Events from '@aerogel/core/services/Events';
import Service from '@aerogel/core/services/Service';
import { facade } from '@noeldemartin/utils';

export class StorageService extends Service {
    public async purge(): Promise<void> {
        await Events.emit('purge-storage');
    }
}

export default facade(StorageService);

declare module '@aerogel/core/services/Events' {
    export interface EventsPayload {
        'purge-storage': void;
    }
}
