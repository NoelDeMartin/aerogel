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
    urlRoute,
} from '@noeldemartin/utils';
import { Container, Model, Sync, dispatch, getBootedModels, isCoreModel, requireEngine } from 'soukai-bis';
import { Errors, Events, translateWithDefault } from '@aerogel/core';
import { Solid, getTrackedModels, trackModels, trackModelsCollection } from '@aerogel/plugin-solid';
import { watchEffect } from 'vue';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { Engine, IndexedDBEngine, JobListener, ModelConstructor } from 'soukai-bis';

import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import { getContainedModels, getRemoteContainerUrl } from '@aerogel/plugin-local-first/lib/models';

import Service, { CloudStatus } from './Cloud.state';

export interface RegisterOptions {
    path?: string;
}

export interface SyncOptions extends JobListener {
    model?: Model;
    models?: Model[];
    refreshUserProfile?: boolean;
    syncDirty?: boolean;
}

export type CloudRegistration = boolean | RegisterOptions | undefined;

export class CloudService extends Service {

    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected pollingInterval: ReturnType<typeof setInterval> | null = null;

    public async whenReady<T>(callback: () => T): Promise<T> {
        if (this.ready) {
            return callback();
        }

        return new Promise((resolve) => {
            const onReady = () => resolve(callback());

            Events.once('cloud:ready', onReady);
        });
    }

    public async setup(modelUrlMappings?: WeakMap<ModelConstructor, Record<string, string>>): Promise<void> {
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

    public async syncIfOnline(options?: SyncOptions): Promise<void>;
    public async syncIfOnline(model: Model): Promise<void>;
    public async syncIfOnline(models: Model[]): Promise<void>;
    public async syncIfOnline(config: SyncOptions | Model | Model[] = {}): Promise<void> {
        if (!this.online) {
            return;
        }

        await this.sync(config as SyncOptions);
    }

    public async sync(options?: SyncOptions): Promise<void>;
    public async sync(model: Model): Promise<void>;
    public async sync(models: Model[]): Promise<void>;
    public async sync(config: SyncOptions | Model | Model[] = {}): Promise<void> {
        const options = isArray(config) ? { models: config } : config instanceof Model ? { model: config } : config;

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
                    const applicationModels = Array.from(getBootedModels().values()).filter(
                        (model) => !isCoreModel(model) && model.cloud !== false,
                    );

                    this.syncJob = new Sync({
                        userProfile: Solid.requireUser(),
                        localEngine: requireEngine(),
                        remoteEngine: Solid.requireEngine(),
                        typeIndexes: await Solid.findTypeIndexes(),
                        applicationModels: applicationModels.map((modelClass) => ({
                            model: modelClass as ModelConstructor,
                            registered: this.registeredModels.some(
                                (registered) => registered.modelClass === modelClass,
                            ),
                        })),
                    });

                    this.syncJob.listeners.add({
                        ...options,
                        onModelsRegistered: () => Solid.clearTypeIndexesCache(),
                        onFinished: (result) =>
                            this.clearLocalModelUpdates({
                                syncedDocumentUrls: result.syncedDocumentUrls,
                                documentsWithErrors: result.documentsWithErrors,
                            }),
                    });

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

    public async track(modelClass: ModelConstructor, options: { register?: CloudRegistration } = {}): Promise<void> {
        if (this.registeredModels.find((registered) => modelClass === registered.modelClass)) {
            return;
        }

        await trackModels(modelClass, {
            created: (model) => this.ready && this.onModelCreated(model),
            updated: (model) => this.ready && this.onModelUpdated(model),
            deleted: (model) => this.ready && this.onModelUpdated(model, { reset: true }),
        });

        if (options.register) {
            const path = typeof options.register === 'object' ? options.register.path : undefined;

            this.whenReady(async () => {
                const rootCollection = this.rootModelCollections[modelClass.modelName];

                modelClass.defaultContainerUrl = rootCollection ?? getRemoteContainerUrl(modelClass, path);
            });

            this.registeredModels.push({ modelClass, path });

            for (const collection of this.modelCollections[modelClass.modelName] ?? []) {
                await trackModelsCollection(modelClass, collection);
            }
        }
    }

    public requireRemoteContainerUrl(modelClass: ModelConstructor): string {
        for (const registration of this.registeredModels) {
            if (modelClass !== registration.modelClass) {
                continue;
            }

            return getRemoteContainerUrl(registration.modelClass, registration.path);
        }

        throw new Error(`Failed resolving remote collection for '${modelClass.modelName}' model`);
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

            if (!this.pollingEnabled) {
                this.pollingInterval = null;

                return;
            }

            this.pollingInterval = setInterval(() => this.sync(), this.pollingMinutes * 60 * 1000);
        });

        this.watchNetworkStatus();
        await this.trackModels();
    }

    protected getDirtyLocalModels(): Model[] {
        const urls = Object.keys(this.localModelUpdates);
        const dirtyLocalModels = [];

        for (const { modelClass } of this.registeredModels) {
            for (const model of getTrackedModels(modelClass, { includeSoftDeleted: true })) {
                dirtyLocalModels.push(...this.getModelsIn(urls, model));
            }
        }

        return dirtyLocalModels;
    }

    protected getModelsIn(urls: string[], model: Model): Model[] {
        const models = [];

        if (model.url && urls.includes(model.url)) {
            models.push(model);
        }

        if (model instanceof Container) {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async backup(modelUrlMappings?: WeakMap<ModelConstructor, Record<string, string>>): Promise<void> {
        throw new Error('Not implemented');
    }

    protected async onApplicationReady(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        const engine = requireEngine() as IndexedDBEngine;
        const containerUrls = await engine.getContainerUrls();

        await this.setReady(!containerUrls.some((containerUrl) => containerUrl.startsWith('solid://')));
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
        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;
    }

    protected async logout(): Promise<void> {
        this.setState({
            autoPush: true,
            localModelUpdates: {},
            modelCollections: {},
            rootModelCollections: {},
            pollingEnabled: true,
            pollingMinutes: 10,
            ready: false,
            setupDismissed: false,
            setupOngoing: false,
            startupSync: true,
            status: CloudStatus.Disconnected,
            syncError: null,
            syncJob: null,
        });
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

        return this.startupSync;
    }

    private async trackModels(): Promise<void> {
        for (const modelClass of getBootedModels().values()) {
            if (isCoreModel(modelClass)) {
                continue;
            }

            await this.track(modelClass, { register: modelClass.cloud });
        }
    }

    private clearLocalModelUpdates(options: {
        syncedDocumentUrls: Set<string>;
        documentsWithErrors?: Set<string>;
    }): void {
        const localModelUpdates = {} as Record<string, number>;
        const syncedDocumentUrlsArray = Array.from(options.syncedDocumentUrls);

        for (const [url, count] of Object.entries(this.localModelUpdates)) {
            const documentUrl = urlRoute(url);
            const wasSynced =
                options.syncedDocumentUrls.has(documentUrl) ||
                syncedDocumentUrlsArray.some((modelUrl) => modelUrl.endsWith('/') && url.startsWith(modelUrl));

            if (wasSynced && !options.documentsWithErrors?.has(documentUrl)) {
                continue;
            }

            localModelUpdates[url] = count;
        }

        this.localModelUpdates = localModelUpdates;
    }

    private onModelCreated(model: Model): void {
        if (!model.url) {
            return;
        }

        this.localModelUpdates = {
            ...this.localModelUpdates,
            [model.url]: 1,
        };

        if (this.autoPush && !this.syncing) {
            SyncQueue.push(model);
        }
    }

    private onModelUpdated(model: Model, options: { reset?: boolean } = {}): void {
        if (!model.url) {
            return;
        }

        const modelUpdates = this.localModelUpdates[model.url] ?? 0;

        this.localModelUpdates = {
            ...this.localModelUpdates,
            [model.url]: options.reset ? 1 : modelUpdates + 1,
        };

        if (this.autoPush && !this.syncing) {
            SyncQueue.push(model);
        }
    }

}

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:ready': void;
        'cloud:backup-started': void;
        'cloud:backup-completed': void;
        'cloud:sync-started': Model[] | undefined;
        'cloud:sync-completed': Model[] | undefined;
    }
}

declare module 'soukai-bis' {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    namespace Model {
        export const cloud: CloudRegistration;
    }
}
