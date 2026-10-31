import { Browser, Errors, Events, translateWithDefault } from '@aerogel/core';
import { getRemoteContainerUrl } from '@aerogel/plugin-local-first/lib/models';
import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import { Solid, refreshTrackedModels, setTrackedModelsContainerUrls, trackModels } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import {
    Semaphore,
    after,
    arrayUnique,
    facade,
    fail,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    isArray,
    isTesting,
    isTruthy,
    objectFromEntries,
    parseBoolean,
    required,
    urlRoute,
} from '@noeldemartin/utils';
import {
    MigrateLocalUrls,
    Model,
    Sync,
    dispatch,
    getBootedModels,
    isCoreModel,
    requireEngine,
    isLocalUrl,
} from 'soukai-bis';
import type { Engine, IndexedDBEngine, JobListener, ModelConstructor, SyncConfig, TypeIndex } from 'soukai-bis';
import { watchEffect } from 'vue';

import Service, { CloudStatus } from './Cloud.state';

export interface RegisterOptions {
    path?: string;
    depth?: number;
    public?: boolean;
}

export interface SyncOptions extends JobListener {
    model?: Model;
    models?: Model[];
    refreshUserProfile?: boolean;
    syncDirty?: boolean;
}

export type CloudRegistration = boolean | RegisterOptions | undefined;

export interface ModelContainerUrls {
    default: string;
    registered: string[];
}

export class CloudService extends Service {
    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected pollingInterval: ReturnType<typeof setInterval> | null = null;
    protected dirtyModelClasses: Map<string, ModelConstructor> = new Map();

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
        this.setupOngoing = true;

        try {
            await Events.emit('cloud:backup-started');
            await this.migrateLocalUrls();
            await this.setReady(true);
            await this.sync();
            await Events.emit('cloud:backup-completed');
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

            Browser.acquireScreenLock();
            SyncQueue.clear(models);

            try {
                await Events.emit('cloud:sync-started', models);

                if (options.refreshUserProfile) {
                    await Solid.refreshUserProfile();
                }

                let syncs = 0;
                let registrationError: unknown;
                let typeIndexes: TypeIndex[] = [];
                const syncDirty = options.syncDirty ?? true;
                const modelsWithFailedRegistration = new Set<ModelConstructor>();

                do {
                    const config = await this.getSyncConfig();

                    typeIndexes = [...(config.publicTypeIndexes ?? []), ...(config.privateTypeIndexes ?? [])];

                    this.syncJob = new Sync(config);

                    this.syncJob.listeners.add({
                        ...options,
                        onModelsRegistered: (typeIndex) => {
                            Solid.clearTypeIndexesCache();
                            typeIndexes.includes(typeIndex) || typeIndexes.push(typeIndex);
                        },
                        onModelsRegistrationFailed: (failedModels, error) => {
                            registrationError ??= error;
                            failedModels.forEach((modelClass) => modelsWithFailedRegistration.add(modelClass));
                        },
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

                    const dirtyLocalModels = await this.getDirtyLocalModels();

                    syncs++;
                    models = dirtyLocalModels.filter(
                        (model) => !this.syncJob?.documentsWithErrors.has(model.requireDocumentUrl()),
                    );
                } while (syncDirty && models.length > 0 && syncs < 3);

                this.setContainerUrls(
                    this.findContainerUrls(typeIndexes, { keepDefaults: modelsWithFailedRegistration }),
                );

                if (registrationError) {
                    await Errors.report(
                        registrationError,
                        translateWithDefault(
                            'cloud.registrationFailed',
                            'Some data could not be registered in your Solid POD, other apps may not find it',
                        ),
                    );
                }

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

                Browser.releaseScreenLock();
                await this.refreshTrackedModels();
                await Events.emit('cloud:sync-completed', models);
            }
        });
    }

    public async track(modelClass: ModelConstructor, options: { register?: CloudRegistration } = {}): Promise<void> {
        if (
            options.register === false ||
            this.registeredModels.find((registered) => modelClass === registered.modelClass)
        ) {
            return;
        }

        if (options.register) {
            const { path, public: isPublic } = typeof options.register === 'object' ? options.register : {};

            this.setupRemoteCollection(modelClass, path);

            this.registeredModels.push({ modelClass, path, public: isPublic });

            await this.initializeTrackedModels(modelClass, options.register);
        }

        modelClass.on('created', (model) => this.ready && this.onModelCreated(model));
        modelClass.on('updated', (model) => this.ready && this.onModelUpdated(model));
        modelClass.on('deleted', (model) => this.ready && this.onModelUpdated(model, { reset: true }));
    }

    public requireRemoteContainerUrl(modelClass: ModelConstructor): string {
        for (const registration of this.registeredModels) {
            if (modelClass !== registration.modelClass) {
                continue;
            }

            return (
                this.defaultContainerUrls[modelClass.modelName] ??
                getRemoteContainerUrl(registration.modelClass, registration.path)
            );
        }

        throw new Error(`Failed resolving remote collection for '${modelClass.modelName}' model`);
    }

    protected override async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('auth:login', ({ authenticator }) => this.login(authenticator));
        Events.on('auth:logout', () => this.logout());
        Events.on('auth:after-logout', () => this.refreshTrackedModels());
        Events.on('purge-storage', () => this.refreshTrackedModels());
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

    protected async getSyncConfig(): Promise<SyncConfig> {
        const applicationModels = Array.from(getBootedModels().values()).filter(
            (model) => !isCoreModel(model) && model.cloud !== false,
        );

        return {
            ...(await Solid.findTypeIndexes()),
            userProfile: Solid.requireUser(),
            localEngine: requireEngine(),
            remoteEngine: Solid.requireEngine(),
            createPublicTypeIndex: () => Solid.findOrCreatePublicTypeIndex(),
            createPrivateTypeIndex: () => Solid.findOrCreatePrivateTypeIndex(),
            applicationModels: applicationModels.map((modelClass) => {
                const registration = this.registeredModels.find((registered) => registered.modelClass === modelClass);

                return {
                    model: modelClass as ModelConstructor,
                    registration: registration ? { path: registration.path, public: registration.public } : false,
                };
            }),
        };
    }

    protected async getDirtyLocalModels(): Promise<Model[]> {
        const dirtyLocalModels: Model[] = [];

        for (const url of Object.keys(this.localModelUpdates)) {
            const model = await this.dirtyModelClasses.get(url)?.find(url);

            model && dirtyLocalModels.push(model);
        }

        return dirtyLocalModels;
    }

    protected async setReady(ready: boolean): Promise<void> {
        if (this.ready || !ready) {
            return;
        }

        await Events.emit('cloud:ready');

        this.ready = true;
    }

    protected async migrateLocalUrls(): Promise<void> {
        const { publicTypeIndexes, privateTypeIndexes } = await Solid.findTypeIndexes();
        const containerUrls = this.findContainerUrls([...publicTypeIndexes, ...privateTypeIndexes]);
        const job = new MigrateLocalUrls({
            engine: requireEngine('ManagesContainers'),
            migrations: objectFromEntries(
                this.registeredModels.map(({ modelClass }) => [
                    modelClass.defaultContainerUrl,
                    required(containerUrls[modelClass.modelName]).default,
                ]),
            ),
        });

        await dispatch(job);

        this.setContainerUrls(containerUrls);
    }

    protected findContainerUrls(
        typeIndexes: TypeIndex[],
        options: { keepDefaults?: Set<ModelConstructor> } = {},
    ): Record<string, ModelContainerUrls> {
        const registrations = typeIndexes.flatMap((typeIndex) => typeIndex.registrations ?? []);

        return objectFromEntries(
            this.registeredModels.map(({ modelClass, path }) => {
                const registeredContainerUrls = arrayUnique(
                    registrations
                        .filter((registration) => registration.registers(modelClass))
                        .map((registration) => registration.instanceContainer)
                        .filter(isTruthy),
                );
                const defaultContainerUrl = this.pickDefaultContainerUrl(modelClass, path, registeredContainerUrls, {
                    keepCurrent: options.keepDefaults?.has(modelClass),
                });

                return [modelClass.modelName, { default: defaultContainerUrl, registered: registeredContainerUrls }];
            }),
        );
    }

    protected pickDefaultContainerUrl(
        modelClass: ModelConstructor,
        path: string | undefined,
        registeredContainerUrls: string[],
        options: { keepCurrent?: boolean } = {},
    ): string {
        const currentContainerUrl = this.defaultContainerUrls[modelClass.modelName];

        if (
            currentContainerUrl &&
            (options.keepCurrent ||
                registeredContainerUrls.length === 0 ||
                registeredContainerUrls.includes(currentContainerUrl))
        ) {
            return currentContainerUrl;
        }

        return registeredContainerUrls[0] ?? getRemoteContainerUrl(modelClass, path);
    }

    protected setContainerUrls(containerUrls: Record<string, ModelContainerUrls>): void {
        for (const { modelClass } of this.registeredModels) {
            const modelContainerUrls = containerUrls[modelClass.modelName];

            if (!modelContainerUrls) {
                continue;
            }

            this.useContainerUrls(modelClass, modelContainerUrls);
        }

        const entries = Object.entries(containerUrls);

        this.setState({
            defaultContainerUrls: {
                ...this.defaultContainerUrls,
                ...objectFromEntries(
                    entries.map(([modelName, modelContainerUrls]) => [modelName, modelContainerUrls.default]),
                ),
            },
            registeredContainerUrls: {
                ...this.registeredContainerUrls,
                ...objectFromEntries(entries.map(([modelName, { registered }]) => [modelName, registered])),
            },
        });
    }

    protected async onApplicationReady(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        const engine = requireEngine() as IndexedDBEngine;
        const containerUrls = await engine.getContainerUrls();

        await this.setReady(!containerUrls.some(isLocalUrl));
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
            defaultContainerUrls: {},
            registeredContainerUrls: {},
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

        for (const { modelClass } of this.registeredModels) {
            setTrackedModelsContainerUrls(modelClass, null);
        }

        this.dirtyModelClasses.clear();
    }

    protected async initializeTrackedModels(
        modelClass: ModelConstructor,
        register: true | RegisterOptions,
    ): Promise<void> {
        await trackModels(modelClass, {
            bypassServicesCheck: true,
            lazy: true,
            depth: typeof register === 'object' ? register.depth : undefined,
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

    private setupRemoteCollection(modelClass: ModelConstructor, path?: string): void {
        const defaultContainerUrl = this.defaultContainerUrls[modelClass.modelName];

        if (defaultContainerUrl) {
            this.useContainerUrls(modelClass, {
                default: defaultContainerUrl,
                registered: this.registeredContainerUrls[modelClass.modelName] ?? [],
            });

            return;
        }

        void this.whenReady(() => {
            const remoteContainerUrl =
                this.defaultContainerUrls[modelClass.modelName] ?? getRemoteContainerUrl(modelClass, path);

            this.setContainerUrls({
                [modelClass.modelName]: {
                    default: remoteContainerUrl,
                    registered: this.registeredContainerUrls[modelClass.modelName] ?? [],
                },
            });
        });
    }

    private useContainerUrls(modelClass: ModelConstructor, containerUrls: ModelContainerUrls): void {
        modelClass.defaultContainerUrl = containerUrls.default;

        setTrackedModelsContainerUrls(modelClass, [containerUrls.default, ...containerUrls.registered]);
    }

    private async trackModels(): Promise<void> {
        for (const modelClass of getBootedModels().values()) {
            if (isCoreModel(modelClass)) {
                continue;
            }

            await this.track(modelClass, { register: modelClass.cloud });
        }
    }

    private async refreshTrackedModels(): Promise<void> {
        for (const modelClass of getBootedModels().values()) {
            if (isCoreModel(modelClass) || modelClass.cloud === false) {
                continue;
            }

            await refreshTrackedModels(modelClass);
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
                this.dirtyModelClasses.delete(url);

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

        this.dirtyModelClasses.set(model.url, model.static());
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

        this.dirtyModelClasses.set(model.url, model.static());
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
    // oxlint-disable-next-line typescript/no-shadow
    namespace Model {
        export const cloud: CloudRegistration;
    }
}
