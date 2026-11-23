import {
    Browser,
    Errors,
    EventListenerPriorities,
    Events,
    NetworkCache,
    UI,
    translateWithDefault,
} from '@aerogel/core';
import type { ButtonVariant } from '@aerogel/core';
import DeletionConflictModal from '@aerogel/plugin-local-first/components/DeletionConflictModal.vue';
import FileConflictModal from '@aerogel/plugin-local-first/components/FileConflictModal.vue';
import { Solid, fileResponse } from '@aerogel/plugin-solid';
import { refreshTrackedModels, setTrackedModelsDiscoveryUrls, trackModels } from '@aerogel/reactivity';
import {
    after,
    arrayUnique,
    facade,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    isArray,
    isObject,
    isTesting,
    parseBoolean,
    required,
} from '@noeldemartin/utils';
import {
    FilesSyncStrategies,
    Sync,
    assertExternalSourceModelsBooted,
    deleteExternalSourceData,
    getBootedModels,
    getExternalSourceUrl,
    isCoreModel,
    isInExternalSource,
} from 'soukai-bis';
import type {
    DeletionConflict,
    DeletionConflictResolution,
    ExternalSource,
    FileConflict,
    FileConflictResolution,
    FilePushedEvent,
    ModelConstructor,
    ModelsRegistrationFailedEvent,
    SyncApplicationModel,
    SyncCompletedEvent,
    SyncFilesConfig,
    SyncProperties,
    SyncSession,
} from 'soukai-bis';
import { watch, watchEffect } from 'vue';

import Service, { CloudStatus } from './Cloud.state';
import type { CloudFiles, TCloudStatus } from './Cloud.state';

export type { CloudFiles, CloudFilesConfig } from './Cloud.state';

export interface RegisterOptions {
    path?: string;
    depth?: number;
    public?: boolean;
    singleton?: boolean;
    files?: CloudFiles;
}

export interface SyncOptions {
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

export interface FileConflictPrompt {
    title?: string;
    message?: string;
    keepLocalText?: string;
    keepLocalVariant?: ButtonVariant;
    keepRemoteText?: string;
    keepRemoteVariant?: ButtonVariant;
    downloadLocalText?: string;
    downloadRemoteText?: string;
}

export interface DocumentConflict extends DeletionConflict {
    resourceType: 'document';
}

export interface CloudFileConflict extends FileConflict {
    resourceType: 'file';
}

export type CloudConflict = DocumentConflict | CloudFileConflict;

export type ConflictHandlerResult =
    | DeletionConflictResolution
    | DeletionConflictPrompt
    | FileConflictResolution
    | FileConflictPrompt
    | undefined;

export type ConflictHandler = (conflict: CloudConflict) => ConflictHandlerResult | Promise<ConflictHandlerResult>;

export interface ExternalSourceFailedPayload {
    source: ExternalSource;
    error: unknown;
}

export class CloudService extends Service {
    public conflictHandler: ConflictHandler | null = null;
    protected pollingInterval: ReturnType<typeof setInterval> | null = null;
    private registeredModels = new Set<ModelConstructor>();
    private syncModels: SyncApplicationModel[] = [];
    private syncStartedAt = 0;
    private syncInProgress = false;
    private registrationError: unknown = null;

    public async setup(): Promise<void> {
        this.setupOngoing = true;

        try {
            await Events.emit('cloud:backup-started');
            await this.requireSyncSession().setup();
            await this.sync();
            await this.refreshTrackedModels();
            await Events.emit('cloud:backup-completed');
        } finally {
            this.setupOngoing = false;
        }
    }

    public dismissSetup(): void {
        this.setupDismissed = true;
    }

    public async sync(options: SyncOptions = {}): Promise<void> {
        if (!Solid.isLoggedIn() || !this.ready || !this.online) {
            return;
        }

        if (options.refreshUserProfile) {
            await Solid.refreshUserProfile();
        }

        await Sync.session?.synchronize();

        if (isTesting() && this.syncError) {
            throw this.syncError;
        }
    }

    public addExternalSource(source: ExternalSource): void {
        const session = Sync.session;

        if (session?.isActive()) {
            session.addExternalSource(source);

            return;
        }

        if (this.hasExternalSource(source)) {
            return;
        }

        assertExternalSourceModelsBooted(source);

        this.externalSources = [...this.externalSources, source];
    }

    public hasExternalSource(source: ExternalSource): boolean {
        const sourceUrl = getExternalSourceUrl(source);

        return this.externalSources.some((externalSource) => getExternalSourceUrl(externalSource) === sourceUrl);
    }

    public isInExternalSource(url: string): boolean {
        return this.externalSources.some((source) => isInExternalSource(source, url));
    }

    public async removeExternalSource(source: ExternalSource): Promise<void> {
        const session = Sync.session;

        if (session?.isActive()) {
            await session.removeExternalSource(source);
        } else {
            const sourceUrl = getExternalSourceUrl(source);

            this.externalSources = this.externalSources.filter(
                (externalSource) => getExternalSourceUrl(externalSource) !== sourceUrl,
            );

            await deleteExternalSourceData(source);
        }

        await this.refreshTrackedModels();
    }

    public requireRemoteContainerUrl(modelClass: ModelConstructor): string {
        return this.requireSyncSession().requireRemoteContainerUrl(modelClass);
    }

    protected override async boot(): Promise<void> {
        await Solid.booted;
        await this.trackModels();

        Solid.isLoggedIn() && (await this.login());

        globalThis.addEventListener('online', () => Sync.session?.setOnline(true));
        globalThis.addEventListener('offline', () => Sync.session?.setOnline(false));

        watch(
            () => Solid.session?.user,
            (user) => !user && Sync.session?.disconnect(),
            { flush: 'sync' },
        );

        watch(
            () => this.autoPush,
            (autoPush) => Sync.session?.setAutoPush(autoPush),
            { flush: 'sync' },
        );

        Events.on('auth:login', () => this.login());
        Events.on('auth:logout', () => this.logout());
        Events.on('auth:after-logout', () => this.refreshTrackedModels());
        Events.on('purge-storage', () => this.refreshTrackedModels());
        Events.on('purge-storage', { priority: EventListenerPriorities.Low }, () =>
            Sync.session?.refreshLocalChanges(),
        );
        Events.once('application-mounted', () => this.onApplicationMounted());

        watchEffect(() => {
            this.pollingInterval && clearInterval(this.pollingInterval);

            if (!this.pollingEnabled) {
                this.pollingInterval = null;

                return;
            }

            this.pollingInterval = setInterval(() => this.sync(), this.pollingMinutes * 60 * 1000);
        });
    }

    protected getSyncModel(modelClass: ModelConstructor, register: CloudRegistration): SyncApplicationModel {
        const options = typeof register === 'object' ? register : {};
        const files = this.normalizeCloudFiles(
            options.files ?? (typeof modelClass.cloud === 'object' ? modelClass.cloud.files : undefined),
        );

        return {
            model: modelClass,
            files: files.length > 0 ? files : undefined,
            registration: register
                ? {
                      path: options.path,
                      public: options.public,
                      mode: options.singleton ? 'instance' : 'container',
                  }
                : false,
        };
    }

    protected async track(modelClass: ModelConstructor, options: { register?: CloudRegistration } = {}): Promise<void> {
        if (options.register === false || this.syncModels.some(({ model }) => model === modelClass)) {
            return;
        }

        Sync.trackLocalChanges(modelClass);

        this.syncModels.push(this.getSyncModel(modelClass, options.register));

        if (options.register) {
            this.registeredModels.add(modelClass);
            this.applySavedContainerUrls(modelClass);

            this.initializeTrackedModels(modelClass, options.register);
        }
    }

    protected async resolveDeletionConflict(conflict: DeletionConflict): Promise<DeletionConflictResolution> {
        const result = await this.conflictHandler?.({ resourceType: 'document', ...conflict });

        if (result === 'delete' || result === 'restore') {
            return result;
        }

        return this.promptDeletionConflict(conflict, isObject(result) ? result : null);
    }

    protected async promptDeletionConflict(
        conflict: DeletionConflict,
        prompt: DeletionConflictPrompt | null,
    ): Promise<DeletionConflictResolution> {
        const { response } = (await UI.modal(DeletionConflictModal, { conflict, prompt })) as unknown as {
            response: DeletionConflictResolution | null;
        };

        return response ?? 'delete';
    }

    protected async resolveFileConflict(conflict: FileConflict): Promise<FileConflictResolution> {
        const result = await this.conflictHandler?.({ resourceType: 'file', ...conflict });

        if (result === 'keep-local' || result === 'keep-remote') {
            return result;
        }

        return this.promptFileConflict(conflict, isObject(result) ? result : null);
    }

    protected async promptFileConflict(
        conflict: FileConflict,
        prompt: FileConflictPrompt | null,
    ): Promise<FileConflictResolution> {
        const { response } = (await UI.modal(FileConflictModal, { conflict, prompt })) as unknown as {
            response: FileConflictResolution | null;
        };

        return response ?? 'keep-local';
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

    protected async login(): Promise<void> {
        await Sync.session?.disconnect();
        await Sync.connect({
            online: navigator.onLine,
            autoPush: this.autoPush,
            profileManager: {
                getProfile: () => Solid.requireUser(),
                findTypeIndexes: () => Solid.findTypeIndexes(),
                createPublicTypeIndex: () => Solid.findOrCreatePublicTypeIndex(),
                createPrivateTypeIndex: () => Solid.findOrCreatePrivateTypeIndex(),
            },
            models: this.syncModels,
            containerUrls: this.containerUrls,
            externalSources: this.externalSources,
            resolveDeletionConflict: this.resolveDeletionConflict.bind(this),
            resolveFileConflict: this.resolveFileConflict.bind(this),
            onModelsRegistered: () => Solid.clearTypeIndexesCache(),
            onUpdated: this.onSyncUpdated.bind(this),
            onContainersUpdated: this.onSyncContainersUpdated.bind(this),
            onSyncStarted: this.onSyncStarted.bind(this),
            onSyncCompleted: this.onSyncCompleted.bind(this),
            onSyncFailed: this.onSyncFailed.bind(this),
            onModelsRegistrationFailed: this.onSyncModelsRegistrationFailed.bind(this),
            onExternalSourceFailed: this.onSyncExternalSourceFailed.bind(this),
            onFilePushed: this.onSyncFilePushed.bind(this),
            onFileUpdated: this.onSyncFileUpdated.bind(this),
        });
    }

    protected async logout(): Promise<void> {
        await Sync.session?.disconnect();

        this.setState({ ...this.getInitialState(), manualSetup: this.manualSetup });

        for (const modelClass of this.registeredModels) {
            setTrackedModelsDiscoveryUrls(modelClass, null);
        }
    }

    protected initializeTrackedModels(modelClass: ModelConstructor, register: true | RegisterOptions): void {
        trackModels(modelClass, { depth: typeof register === 'object' ? register.depth : undefined });
    }

    private async onSyncUpdated(changes: Partial<SyncProperties>): Promise<void> {
        if (changes.localChangesCount !== undefined) {
            this.localChangesCount = changes.localChangesCount;
        }

        if (changes.containerUrls) {
            this.containerUrls = changes.containerUrls;
        }

        if (changes.externalSources) {
            this.externalSources = changes.externalSources;
        }

        if (changes.activeJob !== undefined) {
            this.syncJob = changes.activeJob;
        }

        if ('error' in changes) {
            this.syncError = changes.error;
        }

        if (changes.setupCompleted !== undefined) {
            const becameReady = changes.setupCompleted && !this.ready;

            this.ready = changes.setupCompleted;

            if (becameReady) {
                await Events.emit('cloud:ready');
            }
        }

        if (!this.syncInProgress) {
            this.status = this.getCloudStatus();
        }
    }

    private async onSyncStarted(): Promise<void> {
        this.syncInProgress = true;
        this.syncStartedAt = Date.now();
        this.status = CloudStatus.Syncing;

        Browser.acquireScreenLock();

        await Events.emit('cloud:sync-started');
    }

    private async onSyncCompleted({ cancelled, error }: SyncCompletedEvent): Promise<void> {
        const succeeded = !cancelled && !error;
        const registrationError = this.registrationError;

        this.registrationError = null;

        if (succeeded && registrationError) {
            await Errors.report(
                registrationError,
                translateWithDefault(
                    'cloud.registrationFailed',
                    'Some data could not be registered in your Solid POD, other apps may not find it',
                ),
            );
        }

        if (succeeded && !isTesting('unit')) {
            await after({ milliseconds: Math.max(500, 1000 - (Date.now() - this.syncStartedAt)) });
        }

        this.syncInProgress = false;
        this.status = this.getCloudStatus();

        Browser.releaseScreenLock();
        await this.refreshTrackedModels();
        await Events.emit('cloud:sync-completed');
    }

    private async onSyncFailed(error: unknown): Promise<void> {
        if (isTesting()) {
            return;
        }

        await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
    }

    private onSyncContainersUpdated(modelClass: ModelConstructor, containerUrls: string[]): void {
        setTrackedModelsDiscoveryUrls(modelClass, containerUrls);
    }

    private onSyncModelsRegistrationFailed({ error }: ModelsRegistrationFailedEvent): void {
        this.registrationError ??= error;
    }

    private async onSyncExternalSourceFailed(source: ExternalSource, error: unknown): Promise<void> {
        await Events.emit('cloud:sync-external-source-failed', { source, error });
    }

    private async onSyncFilePushed({ url, blob }: FilePushedEvent): Promise<void> {
        await NetworkCache.store(url, fileResponse(blob));
    }

    private async onSyncFileUpdated(url: string): Promise<void> {
        await NetworkCache.delete(url);
        await Events.emit('solid:file-updated', { url });
    }

    private getCloudStatus(): TCloudStatus {
        const session = Sync.session;

        if (!session?.connected) {
            return CloudStatus.Disconnected;
        }

        if (session.syncing) {
            return CloudStatus.Syncing;
        }

        return session.online ? CloudStatus.Online : CloudStatus.Offline;
    }

    private requireSyncSession(): SyncSession {
        return required(Sync.session, "Cloud isn't connected, log in first");
    }

    private syncOnStartup(): boolean {
        if (hasLocationQueryParameter('startupSync')) {
            return parseBoolean(getLocationQueryParameter('startupSync'));
        }

        return this.startupSync;
    }

    private applySavedContainerUrls(modelClass: ModelConstructor): void {
        const containerUrls = this.containerUrls[modelClass.modelName];

        if (!containerUrls) {
            return;
        }

        if (this.ready) {
            modelClass.defaultContainerUrl = containerUrls.default;
        }

        setTrackedModelsDiscoveryUrls(
            modelClass,
            arrayUnique([
                containerUrls.default,
                ...containerUrls.instances,
                ...containerUrls.registered,
                ...containerUrls.unlisted,
            ]),
        );
    }

    private normalizeCloudFiles(files: CloudFiles | undefined): SyncFilesConfig[] {
        if (!files) {
            return [];
        }

        if (files === true) {
            return [{ strategy: FilesSyncStrategies.Container }];
        }

        if (typeof files === 'string') {
            return [{ strategy: files }];
        }

        return (isArray(files) ? files : [files]).map((config) => ({
            ...config,
            strategy: config.strategy ?? (config.fields ? FilesSyncStrategies.Document : FilesSyncStrategies.Container),
        }));
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
}

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:ready': void;
        'cloud:backup-started': void;
        'cloud:backup-completed': void;
        'cloud:sync-started': void;
        'cloud:sync-completed': void;
        'cloud:sync-external-source-failed': ExternalSourceFailedPayload;
    }
}

declare module 'soukai-bis' {
    // oxlint-disable-next-line typescript/no-shadow
    namespace Model {
        export const cloud: CloudRegistration;
    }
}
