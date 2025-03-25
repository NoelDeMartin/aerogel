import { Cloud } from '@aerogel/plugin-local-first';
import { facade } from '@noeldemartin/utils';
import { trackModels } from '@aerogel/plugin-soukai';

import LocalTask from '@/models/LocalTask';
import SolidTasks from '@/services/SolidTasks';

import Service from './LocalTasks.state';

export class LocalTasksService extends Service {

    protected override async boot(): Promise<void> {
        await Cloud.booted;
        await Cloud.register(LocalTask);

        Cloud.whenReady(async () => {
            const tasksContainer = await SolidTasks.tasksContainer;

            LocalTask.collection = tasksContainer.url;
        });

        await trackModels(LocalTask, {
            service: this,
            property: '_all',
        });
    }

}

export default facade(LocalTasksService);
