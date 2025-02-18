import { facade } from '@noeldemartin/utils';

import Events from '@/services/Events';
import Service from '@/services/Service';

export class StorageService extends Service {

    public async purge(): Promise<void> {
        await Events.emit('purge-storage');
    }

}

export default facade(StorageService);

declare module '@/services/Events' {
    export interface EventsPayload {
        'purge-storage': void;
    }
}
