import { Cloud } from '@aerogel/plugin-offline-first';
import { Events } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';
import { trackModelCollection } from '@aerogel/plugin-soukai';

import OfflineTask from '@/models/OfflineTask';
import SolidTasks from '@/services/SolidTasks';

import Service from './OfflineTasks.state';

export class OfflineTasksService extends Service {

    protected async boot(): Promise<void> {
        Events.on('login', () => this.login());

        await trackModelCollection(OfflineTask, {
            service: this,
            property: 'allTasks',
        });

        this.hasRemote && this.setupCloud();
    }

    protected async login(): Promise<void> {
        const container = await SolidTasks.tasksContainer;

        this.setState('remoteContainerUrl', container.url);
        this.setupCloud();
    }

    protected async setupCloud(): Promise<void> {
        await Cloud.booted;

        OfflineTask.collection = this.remoteContainerUrl ?? OfflineTask.collection;

        Cloud.registerHandler({
            modelClass: OfflineTask,
            getLocalModels: () => this.allTasks,
        });
    }

}

export default facade(new OfflineTasksService());
