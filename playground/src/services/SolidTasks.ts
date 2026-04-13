import { Events } from '@aerogel/core';
import { facade, required, stringToSlug, tap, urlResolveDirectory } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { Container, type ModelWithUrl, defineSchema } from 'soukai-bis';
import type { AuthSession } from '@aerogel/plugin-solid';

import SolidTask from '@/models/SolidTask';

import Service from './SolidTasks.state';

export class SolidTasksService extends Service {

    protected override async boot(): Promise<void> {
        Events.on('auth:login', async (session) => {
            const container = await this.findOrCreateTasksContainer(session);

            SolidTask.setEngine(Solid.requireAuthenticator().engine);
            SolidTask.defaultContainerUrl = container.url;

            this.tasksContainer.resolve(container);
            this.setState('tasksContainer', this.tasksContainer);
        });
    }

    private async findOrCreateTasksContainer(session: AuthSession): Promise<ModelWithUrl<Container>> {
        const typeIndex = await Solid.findOrCreatePrivateTypeIndex();
        const RemoteContainer = tap(defineSchema(Container), (model) => model.setEngine(session.authenticator.engine));
        const [remoteContainer] = await RemoteContainer.createFromTypeIndex(typeIndex, SolidTask);

        if (remoteContainer) {
            const container = await Container.createFromJsonLD(await remoteContainer.toJsonLD(), {
                url: remoteContainer.url,
            });

            return required(container);
        }

        // In a real application, you would confirm the name and url of the container with the user before
        // proceeding. In this playground we're going on ahead to simplify the UI.
        const name = 'Tasks';
        const url = urlResolveDirectory(session.user.storageUrls[0], stringToSlug(name));

        return Solid.createPrivateContainer({
            url,
            name,
            registerFor: SolidTask,
            reuseExisting: true,
        });
    }

}

export default facade(SolidTasksService);
