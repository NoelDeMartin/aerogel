import { Errors, Events, dispatch, translateWithDefault } from '@aerogel/core';
import { getTrackedModels, trackModelCollection } from '@aerogel/plugin-soukai';
import { Semaphore, after, arrayEquals, arrayFilter, facade, fail, map, objectWithout } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidModel, Tombstone } from 'soukai-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { Engine } from 'soukai';
import type { SolidModelConstructor, SolidTypeIndex } from 'soukai-solid';

import MigrateLocalDocuments from '@/jobs/MigrateLocalDocuments';
import { loadChildren, saveModelAndChildren, synchronizeModels } from '@/lib/synchronization';
import {
    cloneLocalModel,
    completeRemoteModels,
    getRemoteClass,
    getRemoteContainersCollection,
    getRemoteModel,
} from '@/lib/mirroring';
import {
    getContainerRegisteredClasses,
    getRelatedClasses,
    isContainer,
    isContainerClass,
    isDirtyOrHasDirtyChildren,
} from '@/lib/inference';

import Service, { CloudStatus } from './Cloud.state';

export class CloudService extends Service {

    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected typeIndex?: SolidTypeIndex | null;

    public async whenReady<T>(callback: () => T): Promise<T> {
        if (this.ready) {
            return callback();
        }

        return new Promise((resolve) => {
            const onReady = () => resolve(callback());

            Events.once('cloud:ready', onReady);
        });
    }

    public async setup(): Promise<void> {
        const job = new MigrateLocalDocuments();

        for (const modelClass of this.registeredModels) {
            if (!isContainerClass(modelClass)) {
                continue;
            }

            const localCollection = modelClass.collection;
            const remoteCollection = getRemoteContainersCollection();

            modelClass.collection = remoteCollection;

            job.migrateCollection(localCollection, remoteCollection);
        }

        await dispatch(job);
        await Events.emit('cloud:migrated');
        await this.setReady(true);
        await this.sync();
    }

    public dismissSetup(): void {
        this.setupDismissed = true;
    }

    public async syncIfOnline(model?: SolidModel): Promise<void> {
        if (!this.online) {
            return;
        }

        await this.sync(model);
    }

    public async sync(model?: SolidModel): Promise<void> {
        if (!Solid.isLoggedIn() || !this.ready) {
            return;
        }

        await this.asyncLock.run(async () => {
            const start = Date.now();

            this.status = CloudStatus.Syncing;

            Events.emit('cloud:sync-started');

            try {
                await this.pullChanges(model);
                await this.pushChanges(model);
                await after({ milliseconds: Math.max(0, 1000 - (Date.now() - start)) });
            } catch (error) {
                await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;

                Events.emit('cloud:sync-completed');
            }
        });
    }

    public async register(modelClass: SolidModelConstructor): Promise<void> {
        const engine = this.engine;

        if (engine) {
            getRelatedClasses(modelClass).forEach((relatedClass) => getRemoteClass(relatedClass).setEngine(engine));
        }

        this.whenReady(() => {
            if (!isContainerClass(modelClass)) {
                return;
            }

            modelClass.collection = getRemoteContainersCollection();
        });

        await trackModelCollection(modelClass, {
            created: (model) => this.createRemoteModel(model),
            updated: (model) => this.updateRemoteModel(model),
        });

        this.registeredModels.add(modelClass);
    }

    protected async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('login', ({ authenticator }) => this.login(authenticator));
        Events.on('logout', () => this.logout());
        Events.once('application-ready', () => this.autoSetup());
        Events.once('application-mounted', () => this.sync());
    }

    protected async setReady(ready: boolean): Promise<void> {
        if (this.ready || !ready) {
            return;
        }

        await Events.emit('cloud:ready');

        this.ready = true;
    }

    protected getLocalModels(): SolidModel[] {
        return [...this.registeredModels].map((modelClass) => getTrackedModels(modelClass)).flat();
    }

    protected async autoSetup(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        await this.setReady(!this.getLocalModels().some((model) => model.url.startsWith('solid://')));
    }

    protected async getTypeIndex(): Promise<SolidTypeIndex | null> {
        if (this.typeIndex === undefined) {
            this.typeIndex = await Solid.findPrivateTypeIndex();
        }

        return this.typeIndex;
    }

    protected login(authenticator: Authenticator): void {
        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;

        getRemoteClass(Tombstone).setEngine(this.engine);

        for (const modelClass of this.registeredModels) {
            getRelatedClasses(modelClass).forEach((relatedClass) =>
                getRemoteClass(relatedClass).setEngine(authenticator.engine));
        }
    }

    protected logout(): void {
        this.setState({
            status: CloudStatus.Disconnected,
            dirtyRemoteModels: map([], 'url'),
            localModelUpdates: {},
            remoteOperationUrls: {},
        });
    }

    protected requireEngine(): Engine {
        return this.engine ?? fail('Could not get required Engine');
    }

    protected async pullChanges(localModel?: SolidModel): Promise<void> {
        const localModels = map(localModel ? [localModel] : this.getLocalModels(), 'url');
        const remoteModelsArray = localModel
            ? await this.fetchRemoteModelsForLocal(localModel)
            : await this.fetchRemoteModels(localModels.getItems());
        const remoteModels = map(remoteModelsArray, (model) => {
            if (model instanceof Tombstone) {
                return model.resourceUrl;
            }

            return model.url;
        });

        await synchronizeModels(localModels, remoteModels, this.remoteOperationUrls);

        this.setState({
            dirtyRemoteModels: map(
                remoteModels.getItems().filter((model) => isDirtyOrHasDirtyChildren(model)),
                'url',
            ),
            remoteOperationUrls: remoteModels.getItems().reduce((urls, model) => {
                const operationUrls = model
                    .getRelatedModels()
                    .map((related) => related.operations ?? [])
                    .flat()
                    .map((operation) => operation.url);

                if (operationUrls.length > 0) {
                    urls[model.url] = operationUrls;
                }

                return urls;
            }, {} as Record<string, string[]>),
        });
    }

    protected async pushChanges(localModel?: SolidModel): Promise<void> {
        const remoteModels = this.dirtyRemoteModels
            .getItems()
            .filter((model) => !localModel || model.url === localModel.url);

        for (const remoteModel of remoteModels) {
            if (remoteModel.isSoftDeleted()) {
                remoteModel.enableHistory();
                remoteModel.enableTombstone();
                await remoteModel.delete();

                return;
            }

            await saveModelAndChildren(remoteModel);
            await this.updateTypeRegistrations(remoteModel);
        }

        this.setState({
            dirtyRemoteModels: localModel
                ? this.dirtyRemoteModels.filter((_, url) => url !== localModel.url)
                : map([], 'url'),
            remoteOperationUrls: remoteModels.reduce((urls, model) => {
                const operationUrls = model
                    .getRelatedModels()
                    .map((related) => related.operations ?? [])
                    .flat()
                    .map((operation) => operation.url);

                if (operationUrls.length > 0) {
                    urls[model.url] = operationUrls;
                }

                return urls;
            }, this.remoteOperationUrls),
            localModelUpdates: localModel ? objectWithout(this.localModelUpdates, localModel.url) : {},
        });
    }

    protected async fetchRemoteModels(localModels: SolidModel[]): Promise<SolidModel[]> {
        const typeIndex = await this.getTypeIndex();

        if (!typeIndex) {
            return [];
        }

        const registeredModels = [...this.registeredModels].map((modelClass) => {
            const registeredChildren = isContainerClass(modelClass) ? getContainerRegisteredClasses(modelClass) : [];

            return {
                modelClass,
                rdfsClasses:
                    registeredChildren.length > 0
                        ? registeredChildren.map((childrenClass) => childrenClass.rdfsClasses).flat()
                        : modelClass.rdfsClasses,
            };
        });

        const remoteModels = await Promise.all(
            typeIndex.registrations.map(async (registration) => {
                const registeredModel = registeredModels.find(
                    ({ rdfsClasses }) =>
                        arrayEquals(rdfsClasses, registration.forClass) && !!registration.instanceContainer,
                );

                if (!registeredModel) {
                    return;
                }

                const remoteClass = getRemoteClass(registeredModel.modelClass);

                if (isContainerClass(remoteClass)) {
                    const container = await remoteClass.find(registration.instanceContainer);

                    container && (await loadChildren(container));

                    return container;
                }

                return remoteClass.from(registration.instanceContainer).all();
            }),
        );

        return completeRemoteModels(localModels, arrayFilter(remoteModels).flat());
    }

    protected async fetchRemoteModelsForLocal(localModel: SolidModel): Promise<SolidModel[]> {
        const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);

        return completeRemoteModels([localModel], arrayFilter([remoteModel]));
    }

    protected async updateTypeRegistrations(remoteModel: SolidModel): Promise<void> {
        if (!isContainer(remoteModel)) {
            return;
        }

        const registeredChildren = getContainerRegisteredClasses(remoteModel.static());

        if (registeredChildren.length === 0) {
            return;
        }

        this.typeIndex ??= await Solid.findOrCreatePrivateTypeIndex();

        if (this.typeIndex.registrations.some((registration) => registration.instanceContainer === remoteModel.url)) {
            return;
        }

        await remoteModel.register(this.typeIndex, registeredChildren);
    }

    protected createRemoteModel(localModel: SolidModel): void {
        const remoteModel = cloneLocalModel(localModel, this.remoteOperationUrls);
        const dirtyRemoteModels = map(this.dirtyRemoteModels.getItems(), 'url');

        dirtyRemoteModels.add(remoteModel);

        this.setState({
            dirtyRemoteModels,
            localModelUpdates: {
                ...this.localModelUpdates,
                [localModel.url]: 1,
            },
        });
    }

    protected async updateRemoteModel(localModel: SolidModel): Promise<void> {
        const remoteModel = getRemoteModel(localModel, this.dirtyRemoteModels, this.remoteOperationUrls);
        const modelUpdates = this.localModelUpdates[localModel.url] ?? 0;

        await SolidModel.synchronize(localModel, remoteModel);

        if (!this.dirtyRemoteModels.hasKey(remoteModel.url)) {
            const dirtyRemoteModels = map(this.dirtyRemoteModels.getItems(), 'url');

            dirtyRemoteModels.add(remoteModel);

            this.setState({ dirtyRemoteModels });
        }

        this.setState({
            localModelUpdates: localModel.isSoftDeleted()
                ? objectWithout(this.localModelUpdates, localModel.url)
                : {
                    ...this.localModelUpdates,
                    [localModel.url]: modelUpdates + 1,
                },
        });
    }

}

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:migrated': void;
        'cloud:ready': void;
        'cloud:sync-completed': void;
        'cloud:sync-started': void;
    }
}
