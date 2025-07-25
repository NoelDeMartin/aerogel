import {
    Semaphore,
    after,
    facade,
    fail,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    isArray,
    isTesting,
    parseBoolean,
} from '@noeldemartin/utils';
import { Errors, Events, appNamespace, dispatch, translateWithDefault } from '@aerogel/core';
import { Solid } from '@aerogel/plugin-solid';
import {
    DocumentsCache,
    SolidContainer,
    SolidModel,
    Tombstone,
    isContainer,
    isContainerClass,
    isSolidModel,
} from 'soukai-solid';
import { getTrackedModels, trackModels, trackModelsCollection } from '@aerogel/plugin-soukai';
import { watchEffect } from 'vue';
import { getBootedModels, requireEngine } from 'soukai';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { Engine } from 'soukai';
import type { JobListener } from '@aerogel/core';
import type { SolidContainsRelation, SolidModelConstructor, SolidSchemaDefinition } from 'soukai-solid';

import {
    clearLocalModelUpdates,
    createRemoteModel,
    getLocalModels,
    getRemoteClass,
    getRemoteContainersCollection,
    updateRemoteModel,
} from '@aerogel/plugin-local-first/lib/mirroring';
import Backup from '@aerogel/plugin-local-first/jobs/Backup';
import Migrate from '@aerogel/plugin-local-first/jobs/Migrate';
import Sync from '@aerogel/plugin-local-first/jobs/Sync';
import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import {
    getContainedModels,
    getContainerRelations,
    getRelatedClasses,
} from '@aerogel/plugin-local-first/lib/inference';

import Service, { CloudStatus } from './Cloud.state';

export interface RegisterOptions {
    path?: string;
}

export interface SyncOptions extends JobListener {
    model?: SolidModel;
    models?: SolidModel[];
    refreshUserProfile?: boolean;
    syncDirty?: boolean;
}

export class CloudService extends Service {

    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected pollingInterval: NodeJS.Timeout | null = null;
    protected documentsCache: DocumentsCache | null = null;

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
        this.setupOngoing = true;

        try {
            await this.backup(modelUrlMappings);
            await this.setReady(true);
            await this.sync();
        } finally {
            this.setupOngoing = false;
        }
    }

    public getEngine(): Engine | null {
        return this.engine;
    }

    public requireEngine(): Engine {
        return this.engine ?? fail('Could not get required Engine');
    }

    public dismissSetup(): void {
        this.setupDismissed = true;
    }

    public dismissMigration(): void {
        this.migrationDismissed = true;
    }

    public postponeMigration(): void {
        this.migrationPostponed = true;
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

        if (!Solid.isLoggedIn() || !this.ready || !this.online) {
            return;
        }

        await this.asyncLock.run(async () => {
            let models = options.model ? [options.model] : options.models;
            const start = Date.now();

            this.syncError = null;
            this.status = CloudStatus.Syncing;

            SyncQueue.clear(models);

            try {
                await Events.emit('cloud:sync-started', models);

                if (options.refreshUserProfile) {
                    await Solid.refreshUserProfile();
                }

                const syncDirty = options.syncDirty ?? true;
                let syncs = 0;

                do {
                    this.syncJob = new Sync(models);

                    this.syncJob.listeners.add(options);

                    await dispatch(this.syncJob);

                    if (this.syncJob.cancelled) {
                        return;
                    }

                    syncs++;
                    models = this.getDirtyLocalModels().filter(
                        (model) => !this.syncJob?.documentsWithErrors.has(model.requireDocumentUrl()),
                    );
                } while (syncDirty && models.length > 0 && syncs < 3);

                if (!isTesting('unit')) {
                    await after({ milliseconds: Math.max(500, 1000 - (Date.now() - start)) });
                }

                this.syncJob = null;
            } catch (error) {
                if (isTesting()) {
                    throw error;
                }

                this.syncJob = null;
                this.syncError = error;

                await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;

                await Events.emit('cloud:sync-completed', models);
            }
        });
    }

    public shouldMigrate(): boolean {
        return this.schemaMigrations.size > 0;
    }

    public async migrate(listener?: JobListener): Promise<void> {
        if (!this.online || !Solid.isLoggedIn() || !this.ready) {
            throw new Error('Data cannot be migrated at the moment');
        }

        if (!this.shouldMigrate()) {
            return;
        }

        await this.asyncLock.run(async () => {
            this.status = CloudStatus.Migrating;
            this.migrationJob ??= new Migrate();

            const start = Date.now();
            const removeListeners: Function[] = [];
            const models = (this.migrationJob.models ??= getLocalModels());

            SyncQueue.clear(models);

            try {
                listener && removeListeners.push(this.migrationJob.listeners.add(listener));

                await Events.emit('cloud:migration-started', models);
                await dispatch(this.migrationJob);

                if (this.migrationJob.cancelled) {
                    await Events.emit('cloud:migration-cancelled', models);

                    return;
                }

                this.migrationJob = null;
                this.migrationDismissed = false;
                this.migrationPostponed = false;

                await after({ milliseconds: Math.max(0, 1000 - (Date.now() - start)) });
                await Events.emit('cloud:migration-completed', models);
            } catch (error) {
                await Errors.report(error, translateWithDefault('cloud.migrationFailed', 'Migration failed'));
            } finally {
                this.status = CloudStatus.Online;

                removeListeners.forEach((removeListener) => removeListener?.());
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

        this.whenReady(async () => {
            const rootCollection = this.rootModelCollections[modelClass.modelName];

            modelClass.useSoftDeletes(true);

            await modelClass.exclusive(
                async () =>
                    (modelClass.collection = rootCollection ?? getRemoteContainersCollection(modelClass, options.path)),
            );
        });

        await trackModels(modelClass, {
            created: (model) => this.ready && createRemoteModel(model),
            updated: (model) => this.ready && updateRemoteModel(model),
            deleted: (model) =>
                this.ready && clearLocalModelUpdates(new Set([model.url ?? model.getDeletedPrimaryKey()])),
        });

        if (isContainerClass(modelClass)) {
            getContainerRelations(modelClass).forEach((relation) => {
                const relatedClass = modelClass
                    .instance()
                    .requireRelation<SolidContainsRelation>(relation).relatedClass;

                relatedClass.on('created', (model) => this.ready && createRemoteModel(model));
                relatedClass.on('updated', (model) => this.ready && updateRemoteModel(model));
                relatedClass.on(
                    'deleted',
                    (model) =>
                        this.ready && clearLocalModelUpdates(new Set([model.url ?? model.getDeletedPrimaryKey()])),
                );
            });
        }

        this.registeredModels.push({ modelClass, path: options.path });

        for (const collection of this.modelCollections[modelClass.modelName] ?? []) {
            await trackModelsCollection(modelClass, collection);
        }
    }

    public registerSchemaMigration(
        modelClass: SolidModelConstructor,
        schema: SolidModelConstructor | SolidSchemaDefinition,
    ): void {
        this.schemaMigrations.set(modelClass, schema);
    }

    public requireRemoteCollection(modelClass: SolidModelConstructor): string {
        for (const registration of this.registeredModels) {
            if (modelClass !== registration.modelClass) {
                continue;
            }

            return getRemoteContainersCollection(registration.modelClass, registration.path);
        }

        throw new Error(`Failed resolving remote collection for '${modelClass.modelName}' model`);
    }

    public getDocumentsCache(): DocumentsCache {
        if (!this.documentsCache) {
            this.documentsCache = new DocumentsCache(appNamespace(), requireEngine());
        }

        return this.documentsCache;
    }

    protected override async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('auth:login', ({ authenticator }) => this.login(authenticator));
        Events.on('auth:logout', () => this.logout());
        Events.once('application-ready', () => this.onApplicationReady());
        Events.once('application-mounted', () => this.onApplicationMounted());

        watchEffect(() => {
            this.pollingInterval && clearInterval(this.pollingInterval);

            if (!this.pollingEnabled || this.migrationJob) {
                this.pollingInterval = null;

                return;
            }

            this.pollingInterval = setInterval(() => this.sync(), this.pollingMinutes * 60 * 1000);
        });

        this.watchNetworkStatus();
        await this.bustDocumentsCache();
        await this.registerModels();
    }

    protected getDirtyLocalModels(): SolidModel[] {
        const urls = Object.keys(this.localModelUpdates);
        const dirtyLocalModels = [];

        for (const { modelClass } of this.registeredModels) {
            for (const model of getTrackedModels(modelClass, { includeSoftDeleted: true })) {
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

    protected async setReady(ready: boolean): Promise<void> {
        if (this.ready || !ready) {
            return;
        }

        await Events.emit('cloud:ready');

        this.ready = true;
    }

    protected async backup(modelUrlMappings?: WeakMap<SolidModelConstructor, Record<string, string>>): Promise<void> {
        await Events.emit('cloud:backup-started');

        modelUrlMappings ??= new WeakMap();

        const job = new Backup();

        for (const { modelClass, path } of this.registeredModels) {
            for (const [local, remote] of Object.entries(modelUrlMappings.get(modelClass) ?? {})) {
                job.migrateUrl(modelClass, local, remote);
            }

            const localCollection = modelClass.instance().getDefaultCollection();
            const remoteCollection = getRemoteContainersCollection(modelClass, path);

            await modelClass.exclusive(async () => (modelClass.collection = remoteCollection));

            job.migrateCollection(modelClass, localCollection, remoteCollection);
        }

        await dispatch(job);
        await Events.emit('cloud:backup-completed');
    }

    protected async onApplicationReady(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        await this.setReady(!getLocalModels().some((model) => model.url.startsWith('solid://')));
    }

    protected async onApplicationMounted(): Promise<void> {
        if (Solid.isLoggedIn() && !this.ready && !this.manualSetup) {
            await this.setup();

            return;
        }

        if (!this.syncOnStartup()) {
            return;
        }

        await this.sync();
    }

    protected login(authenticator: Authenticator): void {
        const relatedClasses = [...this.registeredModels]
            .map(({ modelClass }) => getRelatedClasses(modelClass))
            .flat()
            .concat([Tombstone]);

        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;

        getRemoteClass(SolidContainer).setEngine(this.engine);

        for (const relatedClass of relatedClasses) {
            getRemoteClass(relatedClass).setEngine(this.engine);
        }
    }

    protected async logout(): Promise<void> {
        this.setState({
            autoPush: true,
            localModelUpdates: {},
            migrationDismissed: false,
            migrationJob: null,
            migrationPostponed: false,
            modelCollections: {},
            rootModelCollections: {},
            pollingEnabled: true,
            pollingMinutes: 10,
            ready: false,
            schemaMigrations: new Map(),
            setupDismissed: false,
            setupOngoing: false,
            startupSync: true,
            status: CloudStatus.Disconnected,
            syncError: null,
            syncJob: null,
        });

        await this.getDocumentsCache().clear();
    }

    private watchNetworkStatus(): void {
        globalThis.addEventListener('online', () => {
            if (this.status !== CloudStatus.Offline) {
                return;
            }

            this.status = CloudStatus.Online;
        });

        globalThis.addEventListener('offline', () => {
            if (this.status !== CloudStatus.Online) {
                return;
            }

            this.status = CloudStatus.Offline;
        });
    }

    private syncOnStartup(): boolean {
        if (hasLocationQueryParameter('startupSync')) {
            return parseBoolean(getLocationQueryParameter('startupSync'));
        }

        if (this.migrationJob) {
            return false;
        }

        return this.startupSync;
    }

    private async bustDocumentsCache(): Promise<void> {
        if (
            !hasLocationQueryParameter('bustDocumentsCache') ||
            !parseBoolean(getLocationQueryParameter('bustDocumentsCache'))
        ) {
            return;
        }

        await this.getDocumentsCache().clear();
    }

    private async registerModels(): Promise<void> {
        const models = getBootedModels();

        for (const model of models.values()) {
            if (!isSolidModel(model) || !model.cloud) {
                continue;
            }

            await this.register(model, typeof model.cloud === 'boolean' ? {} : model.cloud);
        }
    }

}

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:ready': void;
        'cloud:backup-started': void;
        'cloud:backup-completed': void;
        'cloud:migration-started': SolidModel[];
        'cloud:migration-cancelled': SolidModel[];
        'cloud:migration-completed': SolidModel[];
        'cloud:sync-started': SolidModel[] | undefined;
        'cloud:sync-completed': SolidModel[] | undefined;
    }
}

declare module 'soukai-solid' {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    namespace SolidModel {
        export const cloud: boolean | RegisterOptions | undefined;
    }
}
