import { Browser, Errors, EventListenerPriorities, Events, UI, translateWithDefault } from '@aerogel/core';
import type { ButtonVariant } from '@aerogel/core';
import DeletionConflictModal from '@aerogel/plugin-local-first/components/DeletionConflictModal.vue';
import { Solid, refreshTrackedModels, setTrackedModelsDiscoveryUrls, trackModels } from '@aerogel/plugin-solid';
import {
    Semaphore,
    after,
    arrayUnique,
    coalesce,
    debounce,
    facade,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    isArray,
    isInstanceOf,
    isTesting,
    objectFromEntries,
    parseBoolean,
    required,
    silenced,
} from '@noeldemartin/utils';
import {
    DocumentNotFound,
    MigrateLocalUrls,
    Model,
    Sync,
    dispatch,
    getBootedModels,
    getExternalSourceUrl,
    getRemoteContainerUrl,
    isCoreModel,
    isInExternalSource,
    requireLocalEngine,
    isLocalUrl,
    trackLocalChanges,
} from 'soukai-bis';
import type {
    DeletionConflict,
    DeletionConflictResolution,
    JobListener,
    ModelConstructor,
    SyncConfig,
    ExternalSource,
    LocalChangeset,
    TypeIndex,
} from 'soukai-bis';
import { watchEffect } from 'vue';

import Service, { CloudStatus } from './Cloud.state';

export interface RegisterOptions {
    path?: string;
    depth?: number;
    public?: boolean;
    singleton?: boolean;
}

export interface SyncOptions extends JobListener {
    model?: Model;
    models?: Model[];
    refreshUserProfile?: boolean;
}

export type CloudRegistration = boolean | RegisterOptions | undefined;

export interface DeletionConflictPrompt {
    title?: string;
    message?: string;
    deleteText?: string;
    deleteVariant?: ButtonVariant;
    restoreText?: string;
    restoreVariant?: ButtonVariant;
}

export type ConflictHandlerResult = DeletionConflictResolution | DeletionConflictPrompt | undefined;

export type ConflictHandler = (
    conflict: DeletionConflict,
    model: Model | null,
) => ConflictHandlerResult | Promise<ConflictHandlerResult>;

export interface ModelContainerUrls {
    default: string;
    registered: string[];
    unlisted: string[];
    instances: string[];
}

export interface ExternalSourceFailedPayload {
    source: ExternalSource;
    error: unknown;
}

export class CloudService extends Service {
    public conflictHandler: ConflictHandler | null = null;
    protected asyncLock: Semaphore = new Semaphore();
    protected pollingInterval: ReturnType<typeof setInterval> | null = null;
    protected previousSyncPendingChangesets: LocalChangeset[] = [];
    private pushLocalChanges = debounce(() => this.syncIfOnline(), 1000);
    private refreshLocalChanges = coalesce(() => this.performLocalChangesRefresh());

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
            const models = options.model ? [options.model] : options.models;
            const start = Date.now();

            this.syncError = null;
            this.status = CloudStatus.Syncing;

            Browser.acquireScreenLock();
            this.cancelPushedLocalChanges();

            try {
                await Events.emit('cloud:sync-started', models);

                if (options.refreshUserProfile) {
                    await Solid.refreshUserProfile();
                }

                let syncs = 0;
                let changesets = await this.getLocalChangesets();
                let previousChangesets: LocalChangeset[] = [];
                let registrationError: unknown;
                let typeIndexes: TypeIndex[] = [];
                const modelsWithFailedRegistration = new Set<ModelConstructor>();

                do {
                    const config = await this.getSyncConfig();

                    typeIndexes = [...(config.publicTypeIndexes ?? []), ...(config.privateTypeIndexes ?? [])];

                    this.syncJob = new Sync(config);

                    this.syncJob.listeners.add({
                        ...options,
                        onModelsRegistered: ({ typeIndex }) => {
                            Solid.clearTypeIndexesCache();
                            typeIndexes.includes(typeIndex) || typeIndexes.push(typeIndex);
                        },
                        onModelsRegistrationFailed: ({ models: failedModels, error }) => {
                            registrationError ??= error;
                            failedModels.forEach((modelClass) => modelsWithFailedRegistration.add(modelClass));
                        },
                        onExternalSourceFailed: (source, error) =>
                            Events.emit('cloud:sync-external-source-failed', { source, error }),
                    });

                    await dispatch(this.syncJob);

                    if (this.syncJob.cancelled) {
                        this.previousSyncPendingChangesets = await this.getLocalChangesets();

                        return;
                    }

                    previousChangesets = changesets;
                    changesets = await this.getLocalChangesets();

                    syncs++;
                } while (
                    changesets.length > 0 &&
                    !this.haveSameChangesets(changesets, previousChangesets) &&
                    syncs < 3
                );

                this.previousSyncPendingChangesets = changesets;

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
                this.previousSyncPendingChangesets = await this.getLocalChangesets();

                if (isTesting()) {
                    throw error;
                }

                this.syncJob = null;
                this.syncError = error;

                await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;

                Browser.releaseScreenLock();
                await this.refreshLocalChanges();
                await this.refreshTrackedModels();
                await Events.emit('cloud:sync-completed', models);
            }
        });
    }

    public async track(modelClass: ModelConstructor, options: { register?: CloudRegistration } = {}): Promise<void> {
        if (
            options.register === false ||
            this.modelRegistrations.find((registration) => modelClass === registration.modelClass)
        ) {
            return;
        }

        trackLocalChanges(modelClass);

        if (options.register) {
            const { path, public: isPublic, singleton } = typeof options.register === 'object' ? options.register : {};

            this.setupRemoteCollection(modelClass, path);

            this.modelRegistrations.push({ modelClass, path, public: isPublic, singleton });

            await this.initializeTrackedModels(modelClass, options.register);
        }

        modelClass.on('created', ({ model }) => this.ready && this.onModelCreated(model));
    }

    public addExternalSource(source: ExternalSource): void {
        if (this.hasExternalSource(source)) {
            return;
        }

        for (const model of source.models) {
            if (getBootedModels().get(model.modelName) !== model) {
                throw new Error(
                    `Can't add external source ${getExternalSourceUrl(source)}, ` +
                        `the '${model.modelName}' model class isn't booted`,
                );
            }
        }

        this.externalSources = [...this.externalSources, source];
    }

    public hasExternalSource(source: ExternalSource): boolean {
        const sourceUrl = getExternalSourceUrl(source);

        return this.externalSources.some((externalSource) => getExternalSourceUrl(externalSource) === sourceUrl);
    }

    public getExternalSources(): ExternalSource[] {
        return this.externalSources.slice(0);
    }

    public isInExternalSource(url: string): boolean {
        return this.externalSources.some((source) => isInExternalSource(source, url));
    }

    public async removeExternalSource(source: ExternalSource): Promise<void> {
        await this.asyncLock.run(async () => {
            const sourceUrl = getExternalSourceUrl(source);
            const documentUrls = source.containerUrl
                ? [...(await this.readExternalContainerDocumentUrls(source.containerUrl)), source.containerUrl]
                : [sourceUrl];

            this.externalSources = this.externalSources.filter(
                (externalSource) => getExternalSourceUrl(externalSource) !== sourceUrl,
            );

            for (const documentUrl of documentUrls) {
                await silenced(requireLocalEngine().deleteDocument(documentUrl), { ignore: DocumentNotFound });
            }

            await this.refreshLocalChanges();
            await this.refreshTrackedModels();
        });
    }

    public requireRemoteContainerUrl(modelClass: ModelConstructor): string {
        for (const registration of this.modelRegistrations) {
            if (modelClass !== registration.modelClass) {
                continue;
            }

            return (
                this.defaultContainerUrls[modelClass.modelName] ??
                this.getDefaultRemoteContainerUrl(registration.modelClass, registration.path)
            );
        }

        throw new Error(`Failed resolving remote collection for '${modelClass.modelName}' model`);
    }

    protected override async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login();

        Events.on('auth:login', () => this.login());
        Events.on('auth:logout', () => this.logout());
        Events.on('auth:after-logout', () => this.refreshTrackedModels());
        Events.on('purge-storage', () => this.refreshTrackedModels());
        Events.on('purge-storage', { priority: EventListenerPriorities.Low }, () => this.refreshLocalChanges());
        Events.once('application-ready', () => this.onApplicationReady());
        Events.once('application-mounted', () => this.onApplicationMounted());
        requireLocalEngine().listeners.add({ onLocalChangesUpdated: () => this.refreshLocalChanges() });

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
        await this.refreshLocalChanges();
    }

    protected async getSyncConfig(): Promise<SyncConfig> {
        const applicationModels = Array.from(getBootedModels().values()).filter(
            (model) => !isCoreModel(model) && model.cloud !== false,
        );

        return {
            ...(await Solid.findTypeIndexes()),
            externalSources: this.getExternalSources(),
            userProfile: Solid.requireUser(),
            createPublicTypeIndex: () => Solid.findOrCreatePublicTypeIndex(),
            createPrivateTypeIndex: () => Solid.findOrCreatePrivateTypeIndex(),
            resolveDeletionConflict: (conflict) =>
                this.resolveDeletionConflict(conflict, applicationModels as ModelConstructor[]),
            applicationModels: applicationModels.map((modelClass) => {
                const registration = this.modelRegistrations.find(
                    (modelRegistration) => modelRegistration.modelClass === modelClass,
                );

                return {
                    model: modelClass as ModelConstructor,
                    registration: registration
                        ? {
                              path: registration.path,
                              public: registration.public,
                              mode: registration.singleton ? 'instance' : 'container',
                          }
                        : false,
                };
            }),
        };
    }

    protected async performLocalChangesRefresh(): Promise<void> {
        const changesets = await this.getLocalChangesets();

        this.localChanges = changesets.length;

        if (!this.shouldPushLocalChanges(changesets)) {
            return;
        }

        this.pushLocalChanges();
    }

    protected async resolveDeletionConflict(
        conflict: DeletionConflict,
        applicationModels: ModelConstructor[],
    ): Promise<DeletionConflictResolution> {
        const document = conflict.type === 'deleted-remotely' ? conflict.localDocument : conflict.remoteDocument;
        const models = await Promise.all(
            applicationModels.map((modelClass) =>
                modelClass.createFromDocument(document, { url: conflict.resourceUrl, includeSoftDeleted: true }),
            ),
        );
        const model = models.find((documentModel) => !!documentModel) ?? null;
        const result = await this.conflictHandler?.(conflict, model);

        if (result === 'delete' || result === 'restore') {
            return result;
        }

        return this.promptDeletionConflict(conflict, model, result ?? null);
    }

    protected async promptDeletionConflict(
        conflict: DeletionConflict,
        model: Model | null,
        prompt: DeletionConflictPrompt | null,
    ): Promise<DeletionConflictResolution> {
        const { response } = (await UI.modal(DeletionConflictModal, { conflict, model, prompt })) as unknown as {
            response: DeletionConflictResolution | null;
        };

        return response ?? 'delete';
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
            migrations: objectFromEntries(
                this.modelRegistrations.map(({ modelClass }) => [
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
            this.modelRegistrations.map(({ modelClass, path }) => {
                const typeRegistrations = registrations.filter((registration) => registration.registers(modelClass));
                const registeredContainerUrls = arrayUnique(
                    typeRegistrations
                        .filter((registration) => registration.registersContainer())
                        .map((registration) => registration.instanceContainer),
                );
                const registeredInstanceUrls = arrayUnique(
                    typeRegistrations
                        .filter((registration) => registration.registersInstance())
                        .map((registration) => registration.instance),
                );
                const defaultContainerUrl = this.pickDefaultContainerUrl(modelClass, path, registeredContainerUrls, {
                    keepCurrent: options.keepDefaults?.has(modelClass),
                });
                const unlistedContainerUrls = (this.unlistedContainerUrls[modelClass.modelName] ?? []).filter(
                    (containerUrl) =>
                        containerUrl !== defaultContainerUrl && !registeredContainerUrls.includes(containerUrl),
                );

                return [
                    modelClass.modelName,
                    {
                        default: defaultContainerUrl,
                        registered: registeredContainerUrls,
                        unlisted: unlistedContainerUrls,
                        instances: registeredInstanceUrls,
                    },
                ];
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

        return registeredContainerUrls[0] ?? this.getDefaultRemoteContainerUrl(modelClass, path);
    }

    protected setContainerUrls(containerUrls: Record<string, ModelContainerUrls>): void {
        for (const { modelClass } of this.modelRegistrations) {
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
            unlistedContainerUrls: {
                ...this.unlistedContainerUrls,
                ...objectFromEntries(entries.map(([modelName, { unlisted }]) => [modelName, unlisted])),
            },
            registeredInstanceUrls: {
                ...this.registeredInstanceUrls,
                ...objectFromEntries(entries.map(([modelName, { instances }]) => [modelName, instances])),
            },
        });
    }

    protected async onApplicationReady(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        const containerUrls = await requireLocalEngine().getContainerUrls();

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

    protected login(): void {
        this.status = CloudStatus.Online;
    }

    protected async logout(): Promise<void> {
        this.setState({
            autoPush: true,
            defaultContainerUrls: {},
            registeredContainerUrls: {},
            unlistedContainerUrls: {},
            registeredInstanceUrls: {},
            pollingEnabled: true,
            pollingMinutes: 10,
            ready: false,
            setupDismissed: false,
            setupOngoing: false,
            startupSync: true,
            externalSources: [],
            status: CloudStatus.Disconnected,
            syncError: null,
            syncJob: null,
        });

        for (const { modelClass } of this.modelRegistrations) {
            setTrackedModelsDiscoveryUrls(modelClass, null);
        }

        this.cancelPushedLocalChanges();
        this.previousSyncPendingChangesets = [];
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
                unlisted: this.unlistedContainerUrls[modelClass.modelName] ?? [],
                instances: this.registeredInstanceUrls[modelClass.modelName] ?? [],
            });

            return;
        }

        void this.whenReady(() => {
            const remoteContainerUrl =
                this.defaultContainerUrls[modelClass.modelName] ?? this.getDefaultRemoteContainerUrl(modelClass, path);

            this.setContainerUrls({
                [modelClass.modelName]: {
                    default: remoteContainerUrl,
                    registered: this.registeredContainerUrls[modelClass.modelName] ?? [],
                    unlisted: this.unlistedContainerUrls[modelClass.modelName] ?? [],
                    instances: this.registeredInstanceUrls[modelClass.modelName] ?? [],
                },
            });
        });
    }

    private useContainerUrls(modelClass: ModelConstructor, containerUrls: ModelContainerUrls): void {
        modelClass.defaultContainerUrl = containerUrls.default;

        setTrackedModelsDiscoveryUrls(modelClass, [
            ...containerUrls.instances,
            containerUrls.default,
            ...containerUrls.registered,
            ...containerUrls.unlisted,
        ]);
    }

    private useModelContainerUrl(model: Model): void {
        const modelClass = model.static();
        const modelName = modelClass.modelName;
        const containerUrl = model.getContainerUrl();
        const containerUrls: ModelContainerUrls = {
            default: this.defaultContainerUrls[modelName] ?? modelClass.defaultContainerUrl,
            registered: this.registeredContainerUrls[modelName] ?? [],
            unlisted: this.unlistedContainerUrls[modelName] ?? [],
            instances: this.registeredInstanceUrls[modelName] ?? [],
        };

        if (
            !containerUrl ||
            this.isInExternalSource(model.requireUrl()) ||
            containerUrls.instances.includes(model.requireUrl()) ||
            !this.modelRegistrations.some((registration) => registration.modelClass === modelClass) ||
            [containerUrls.default, ...containerUrls.registered, ...containerUrls.unlisted].includes(containerUrl)
        ) {
            return;
        }

        this.setContainerUrls({
            [modelName]: { ...containerUrls, unlisted: [...containerUrls.unlisted, containerUrl] },
        });
    }

    private getDefaultRemoteContainerUrl(modelClass: ModelConstructor, path?: string): string {
        return getRemoteContainerUrl(modelClass, Solid.requireUser().storageUrls[0], path);
    }

    private async getLocalChangesets(): Promise<LocalChangeset[]> {
        return requireLocalEngine().getLocalChangesets();
    }

    private cancelPushedLocalChanges(): void {
        this.pushLocalChanges.cancel();
    }

    private shouldPushLocalChanges(changesets: LocalChangeset[]): boolean {
        return (
            this.autoPush &&
            this.ready &&
            !this.syncing &&
            changesets.length > 0 &&
            !this.haveSameChangesets(changesets, this.previousSyncPendingChangesets)
        );
    }

    private haveSameChangesets(changesets: LocalChangeset[], otherChangesets: LocalChangeset[]): boolean {
        return (
            changesets.length === otherChangesets.length &&
            changesets.every((changeset, index) => changeset.date.getTime() === otherChangesets[index]?.date.getTime())
        );
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

    private async readExternalContainerDocumentUrls(containerUrl: string): Promise<string[]> {
        try {
            const documents = await requireLocalEngine().readDocuments({ containerUrl, deep: true });

            return Object.keys(documents);
        } catch (error) {
            if (!isInstanceOf(error, DocumentNotFound)) {
                throw error;
            }

            return [];
        }
    }

    private onModelCreated(model: Model): void {
        if (!model.url) {
            return;
        }

        this.useModelContainerUrl(model);
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
        'cloud:sync-external-source-failed': ExternalSourceFailedPayload;
    }
}

declare module 'soukai-bis' {
    // oxlint-disable-next-line typescript/no-shadow
    namespace Model {
        export const cloud: CloudRegistration;
    }
}
