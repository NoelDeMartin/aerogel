import { Cloud } from '@aerogel/plugin-local-first';
import { facade } from '@noeldemartin/utils';
import { trackModels } from '@aerogel/plugin-soukai';

import LocalTask from '@/models/LocalTask';

import Service from './LocalTasks.state';

export class LocalTasksService extends Service {

    protected override async boot(): Promise<void> {
        await Cloud.booted;
        await Cloud.register(LocalTask, { path: '/tasks/' });
        await trackModels(LocalTask, {
            service: this,
            property: '_all',
        });
    }

}

export default facade(LocalTasksService);
