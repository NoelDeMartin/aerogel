import { Events } from '@aerogel/core';
import { facade, stringToSlug, urlResolveDirectory } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidContainer } from 'soukai-solid';
import type { AuthSession } from '@aerogel/plugin-solid';

import SolidTask from '@/models/SolidTask';

import Service from './SolidTasks.state';

export class SolidTasksService extends Service {

    protected async boot(): Promise<void> {
        Events.on('login', async (session) => {
            const container = await this.findOrCreateTasksContainer(session);

            SolidTask.setEngine(Solid.requireAuthenticator().engine);
            SolidTask.collection = container.url;

            this.tasksContainer.resolve(container);
            this.setState('tasksContainer', this.tasksContainer);
        });
    }

    private async findOrCreateTasksContainer(session: AuthSession): Promise<SolidContainer> {
        // In a real application, you would confirm the name and url of the container with the user before
        // proceeding. In this playground we're going on ahead to simplify the UI.
        const name = 'Tasks';
        const url = urlResolveDirectory(session.user.storageUrls[0], stringToSlug(name));
        const typeIndex = await Solid.findOrCreatePrivateTypeIndex();
        const containers = await SolidContainer.withEngine(session.authenticator.engine).fromTypeIndex(
            typeIndex.url,
            SolidTask,
        );

        return (
            containers.find((container) => container.url === url) ??
            (await Solid.createPrivateContainer({
                url,
                name,
                registerFor: SolidTask,
                reuseExisting: true,
            }))
        );
    }

}

export default facade(SolidTasksService);
