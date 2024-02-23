import { Cloud } from '@aerogel/plugin-offline-first';
import { facade } from '@noeldemartin/utils';
import { trackModelCollection } from '@aerogel/plugin-soukai';

import OfflineTask from '@/models/OfflineTask';
import SolidTasks from '@/services/SolidTasks';

import Service from './OfflineTasks.state';

export class OfflineTasksService extends Service {

    protected async boot(): Promise<void> {
        await Cloud.booted;
        await Cloud.registerHandler({
            modelClass: OfflineTask,
            getLocalModels: () => this.allTasks,
        });

        Cloud.whenReady(async () => {
            const tasksContainer = await SolidTasks.tasksContainer;

            OfflineTask.collection = tasksContainer.url;
        });

        await trackModelCollection(OfflineTask, {
            service: this,
            property: 'allTasks',
        });
    }

}

export default facade(OfflineTasksService);
