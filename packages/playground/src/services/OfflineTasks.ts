import { Cloud } from '@aerogel/plugin-offline-first';
import { facade } from '@noeldemartin/utils';
import { trackModels } from '@aerogel/plugin-soukai';

import OfflineTask from '@/models/OfflineTask';
import SolidTasks from '@/services/SolidTasks';

import Service from './OfflineTasks.state';

export class OfflineTasksService extends Service {

    protected async boot(): Promise<void> {
        await Cloud.booted;
        await Cloud.register(OfflineTask);

        Cloud.whenReady(async () => {
            const tasksContainer = await SolidTasks.tasksContainer;

            OfflineTask.collection = tasksContainer.url;
        });

        await trackModels(OfflineTask, {
            service: this,
            property: 'allTasks',
        });
    }

}

export default facade(OfflineTasksService);
