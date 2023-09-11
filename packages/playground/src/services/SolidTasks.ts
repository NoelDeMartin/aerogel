import { Events } from '@aerogel/core';
import { facade, stringToSlug, urlResolveDirectory } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidContainer } from 'soukai-solid';
import type { SolidTypeIndex } from 'soukai-solid';

import SolidTask from '@/models/SolidTask';

import Service from './SolidTasks.state';

export class SolidTasksService extends Service {

    protected async boot(): Promise<void> {
        await super.boot();

        Events.on('login', async () => {
            const container = await this.findOrCreateTasksContainer();

            SolidTask.setEngine(Solid.requireAuthenticator().engine);
            SolidTask.collection = container.url;

            this.setState({ ready: true });
        });
    }

    protected async findOrCreateTasksContainer(): Promise<SolidContainer> {
        const engine = Solid.requireAuthenticator().engine;

        return SolidContainer.withEngine(engine, async () => {
            const typeIndex = await Solid.findOrCreatePrivateTypeIndex();
            const container = await SolidContainer.fromTypeIndex(typeIndex.url, SolidTask);

            return container ?? (await this.createTasksContainer(typeIndex));
        });
    }

    protected async createTasksContainer(typeIndex: SolidTypeIndex): Promise<SolidContainer> {
        // In a real application, you would confirm these with the user before proceeding to create a new container.
        // In this playground we're going on ahead to simplify the UI.
        const name = 'Tasks';
        const storageUrl = Solid.user?.storageUrls[0] ?? '';
        const url = urlResolveDirectory(storageUrl, stringToSlug(name));
        const container = (await SolidContainer.find(url)) ?? new SolidContainer({ url, name });

        await container.save();
        await container.register(typeIndex.url, SolidTask);

        return container;
    }

}

export default facade(new SolidTasksService());
