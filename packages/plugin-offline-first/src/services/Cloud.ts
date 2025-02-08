import { Errors, Events, dispatch, translateWithDefault } from '@aerogel/core';
import { Semaphore, after, facade, fail, isArray, map } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidModel, Tombstone, isContainer, isContainerClass } from 'soukai-solid';
import { getTrackedModels, trackModels, trackModelsCollection } from '@aerogel/plugin-soukai';
import { watchEffect } from 'vue';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { Engine } from 'soukai';
import type { SolidContainsRelation, SolidModelConstructor } from 'soukai-solid';

import {
    createRemoteModel,
    getLocalModels,
    getRemoteClass,
    getRemoteContainersCollection,
    updateRemoteModel,
} from '@/lib/mirroring';
import MigrateLocalDocuments from '@/jobs/MigrateLocalDocuments';
import Sync from '@/jobs/Sync';
import SyncQueue from '@/lib/SyncQueue';
import { getContainedModels, getContainerRelations, getRelatedClasses } from '@/lib/inference';

import Service, { CloudStatus } from './Cloud.state';

export interface RegisterOptions {
    path?: string;
}

export interface SyncOptions {
    refreshUserProfile?: boolean;
    model?: SolidModel;
    models?: SolidModel[];
}

export class CloudService extends Service {

    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected pollingInterval: NodeJS.Timeout | null = null;

    public async whenReady<T>(callback: () => T): Promise<T> {
        if (this.ready) {
            return callback();
        }

        return new Promise((resolve) => {
            const onReady = () => resolve(callback());

            Events.once('cloud:ready', onReady);
        });
    }

    public async setup(modelUrlMappings?: WeakMap<SolidModelConstructor, Record<string, string>>): Promise<void> {
        await this.migrateLocalDocuments(modelUrlMappings);
        await Events.emit('cloud:migrated');
        await this.setReady(true);
        await this.sync();
    }

    public dismissSetup(): void {
        this.setupDismissed = true;
    }

    public async syncIfOnline(options?: SyncOptions): Promise<void>;
    public async syncIfOnline(model: SolidModel): Promise<void>;
    public async syncIfOnline(models: SolidModel[]): Promise<void>;
    public async syncIfOnline(config: SyncOptions | SolidModel | SolidModel[] = {}): Promise<void> {
        if (!this.online) {
            return;
        }

        await this.sync(config as SyncOptions);
    }

    public async sync(options?: SyncOptions): Promise<void>;
    public async sync(model: SolidModel): Promise<void>;
    public async sync(models: SolidModel[]): Promise<void>;
    public async sync(config: SyncOptions | SolidModel | SolidModel[] = {}): Promise<void> {
        const options = isArray(config)
            ? { models: config }
            : config instanceof SolidModel
                ? { model: config }
                : config;

        if (!Solid.isLoggedIn() || !this.ready) {
            return;
        }

        await this.asyncLock.run(async () => {
            const start = Date.now();
            const models = options.model ? [options.model] : options.models;

            this.status = CloudStatus.Syncing;

            SyncQueue.clear(models);

            await Events.emit('cloud:sync-started', models);

            try {
                if (options.refreshUserProfile) {
                    await Solid.refreshUserProfile();
                }

                await dispatch(new Sync(models));

                while (this.dirty) {
                    await dispatch(new Sync(this.getDirtyLocalModels()));
                }

                await after({ milliseconds: Math.max(0, 1000 - (Date.now() - start)) });
            } catch (error) {
                await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;

                await Events.emit('cloud:sync-completed', models);
            }
        });
    }

    public async register(modelClass: SolidModelConstructor, options: RegisterOptions = {}): Promise<void> {
        if (this.registeredModels.find((registered) => modelClass === registered.modelClass)) {
            return;
        }

        const engine = this.engine;

        if (engine) {
            getRelatedClasses(modelClass).forEach((relatedClass) => getRemoteClass(relatedClass).setEngine(engine));
        }

        this.whenReady(() => {
            if (!isContainerClass(modelClass)) {
                return;
            }

            modelClass.collection = getRemoteContainersCollection(options.path);
        });

        await trackModels(modelClass, {
            created: (model) => createRemoteModel(model),
            updated: (model) => updateRemoteModel(model),
        });

        if (isContainerClass(modelClass)) {
            getContainerRelations(modelClass).forEach((relation) => {
                const relatedClass = modelClass
                    .instance()
                    .requireRelation<SolidContainsRelation>(relation).relatedClass;

                relatedClass.on('created', (model) => createRemoteModel(model));
                relatedClass.on('updated', (model) => updateRemoteModel(model));
            });
        }

        this.registeredModels.push({ modelClass, path: options.path });

        for (const collection of this.modelCollections[modelClass.modelName] ?? []) {
            await trackModelsCollection(modelClass, collection);
        }
    }

    public requireRemoteCollection(modelClass: SolidModelConstructor): string {
        for (const registration of this.registeredModels) {
            if (modelClass !== registration.modelClass) {
                continue;
            }

            return getRemoteContainersCollection(registration.path);
        }

        throw new Error(`Failed resolving remote collection for '${modelClass.modelName}' model`);
    }

    protected async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('auth:login', ({ authenticator }) => this.login(authenticator));
        Events.on('auth:logout', () => this.logout());
        Events.once('application-ready', () => this.autoSetup());
        Events.once('application-mounted', () => this.startupSync && this.sync());

        watchEffect(() => {
            this.pollingInterval && clearInterval(this.pollingInterval);

            if (!this.pollingEnabled) {
                this.pollingInterval = null;

                return;
            }

            this.pollingInterval = setInterval(() => this.sync(), this.pollingMinutes * 60 * 1000);
        });
    }

    protected getDirtyLocalModels(): SolidModel[] {
        const urls = Object.keys(this.localModelUpdates);
        const dirtyLocalModels = [];

        for (const { modelClass } of this.registeredModels) {
            for (const model of getTrackedModels(modelClass)) {
                dirtyLocalModels.push(...this.getModelsIn(urls, model));
            }
        }

        return dirtyLocalModels;
    }

    protected getModelsIn(urls: string[], model: SolidModel): SolidModel[] {
        const models = [];

        if (urls.includes(model.url)) {
            models.push(model);
        }

        if (isContainer(model)) {
            models.push(
                ...getContainedModels(model)
                    .map((containedModel) => this.getModelsIn(urls, containedModel))
                    .flat(),
            );
        }

        return models;
    }

    protected requireEngine(): Engine {
        return this.engine ?? fail('Could not get required Engine');
    }

    protected async setReady(ready: boolean): Promise<void> {
        if (this.ready || !ready) {
            return;
        }

        await Events.emit('cloud:ready');

        this.ready = true;
    }

    protected async migrateLocalDocuments(
        modelUrlMappings?: WeakMap<SolidModelConstructor, Record<string, string>>,
    ): Promise<void> {
        modelUrlMappings ??= new WeakMap();

        const job = new MigrateLocalDocuments();

        for (const { modelClass, path } of this.registeredModels) {
            if (!isContainerClass(modelClass)) {
                continue;
            }

            for (const [local, remote] of Object.entries(modelUrlMappings.get(modelClass) ?? {})) {
                job.migrateUrl(modelClass, local, remote);
            }

            const localCollection = modelClass.collection;
            const remoteCollection = getRemoteContainersCollection(path);

            modelClass.collection = remoteCollection;

            job.migrateCollection(modelClass, localCollection, remoteCollection);
        }

        await dispatch(job);
    }

    protected async autoSetup(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        await this.setReady(!getLocalModels().some((model) => model.url.startsWith('solid://')));
    }

    protected login(authenticator: Authenticator): void {
        const relatedClasses = [...this.registeredModels]
            .map(({ modelClass }) => getRelatedClasses(modelClass))
            .flat()
            .concat([Tombstone]);

        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;

        for (const relatedClass of relatedClasses) {
            getRemoteClass(relatedClass).setEngine(this.engine);
        }
    }

    protected logout(): void {
        this.setState({
            dirtyRemoteModels: map([], 'url'),
            localModelUpdates: {},
            ready: false,
            modelCollections: {},
            remoteOperationUrls: {},
            setupDismissed: false,
            startupSync: true,
            status: CloudStatus.Disconnected,
            pollingEnabled: true,
            pollingMinutes: 10,
        });
    }

}

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:migrated': void;
        'cloud:ready': void;
        'cloud:sync-completed': SolidModel[] | undefined;
        'cloud:sync-started': SolidModel[] | undefined;
    }
}
