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
            this.tasksContainerUrl ??= (await SolidTasks.tasksContainer).url;

            LocalTask.collection = this.tasksContainerUrl;
        });

        await trackModels(LocalTask, {
            service: this,
            property: '_all',
        });
    }

}

export default facade(LocalTasksService);
