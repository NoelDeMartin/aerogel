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
import FileConflictModal from '@aerogel/plugin-local-first/components/FileConflictModal.vue';
import ResourceConflictModal from '@aerogel/plugin-local-first/components/ResourceConflictModal.vue';
import { getCloudRegistration } from '@aerogel/plugin-local-first/utils/cloud';
import { Solid, fileResponse } from '@aerogel/plugin-solid';
import { bootSync, refreshTrackedModels, trackModels, useLocalChanges } from '@aerogel/reactivity';
import {
    after,
    facade,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    isArray,
    isTesting,
    parseBoolean,
    required,
} from '@noeldemartin/utils';
import { FilesSyncStrategies, Sync, getBootedModels, isCoreModel, isFileConflict } from 'soukai-bis';
import type {
    ExternalSource,
    FileConflict,
    FileConflictResolution,
    FilePushedEvent,
    ModelConstructor,
    ModelsRegistrationFailedEvent,
    ResourceConflict,
    ResourceConflictResolution,
    SyncApplicationModel,
    SyncCompletedEvent,
    SyncConflict,
    SyncConflictResolution,
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

export interface ResourceConflictPrompt {
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

export type ConflictPrompt = ResourceConflictPrompt | FileConflictPrompt;
export type ConflictHandlerResult = SyncConflictResolution | ConflictPrompt | undefined;
export type ConflictHandler = (conflict: SyncConflict) => ConflictHandlerResult | Promise<ConflictHandlerResult>;

export interface ExternalSourceFailedPayload {
    source: ExternalSource;
    error: unknown;
}

export class CloudService extends Service {
    public conflictHandler: ConflictHandler | null = null;
    protected pollingInterval: ReturnType<typeof setInterval> | null = null;
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

    public async addExternalSource(source: ExternalSource): Promise<void> {
        await Sync.addExternalSource(source);
    }

    public hasExternalSource(source: ExternalSource): boolean {
        return Sync.hasExternalSource(source);
    }

    public isInExternalSource(url: string): boolean {
        return Sync.isInExternalSource(url);
    }

    public async removeExternalSource(source: ExternalSource): Promise<void> {
        await Sync.removeExternalSource(source);
        await this.refreshTrackedModels();
    }

    public requireRemoteContainerUrl(modelClass: ModelConstructor): string {
        return this.requireSyncSession().requireRemoteContainerUrl(modelClass);
    }

    protected override async boot(): Promise<void> {
        await Solid.booted;
        await this.trackModels();
        await this.bootSync();

        this.watchLocalChanges();

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
        Events.on('auth:before-logout', () => this.beforeLogout());
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
        const files = this.normalizeCloudFiles(options.files ?? this.getRegisteredFiles(modelClass));

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

        this.syncModels.push(this.getSyncModel(modelClass, options.register));

        if (options.register) {
            this.initializeTrackedModels(modelClass, options.register);
        }
    }

    protected async resolveConflict(conflict: SyncConflict): Promise<SyncConflictResolution> {
        const result = await this.conflictHandler?.(conflict);

        if (typeof result === 'string') {
            return result;
        }

        return isFileConflict(conflict)
            ? this.promptFileConflict(conflict, result)
            : this.promptResourceConflict(conflict, result);
    }

    protected async promptResourceConflict(
        conflict: ResourceConflict,
        prompt?: ResourceConflictPrompt,
    ): Promise<ResourceConflictResolution> {
        const { response } = (await UI.modal(ResourceConflictModal, { conflict, prompt })) as unknown as {
            response: ResourceConflictResolution | null;
        };

        return response ?? 'delete';
    }

    protected async promptFileConflict(
        conflict: FileConflict,
        prompt?: FileConflictPrompt,
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
            online: isTesting('e2e') || navigator.onLine,
            autoPush: this.autoPush,
            profileManager: {
                getProfile: () => Solid.requireUser(),
                findTypeIndexes: () => Solid.findTypeIndexes(),
                createPublicTypeIndex: () => Solid.findOrCreatePublicTypeIndex(),
                createPrivateTypeIndex: () => Solid.findOrCreatePrivateTypeIndex(),
                onProfileUpdated: (profile) => Solid.rememberProfile(profile),
            },
            resolveConflict: this.resolveConflict.bind(this),
            onModelsRegistered: () => Solid.clearTypeIndexesCache(),
            onUpdated: this.onSyncUpdated.bind(this),
            onSyncStarted: this.onSyncStarted.bind(this),
            onSyncCompleted: this.onSyncCompleted.bind(this),
            onSyncFailed: this.onSyncFailed.bind(this),
            onModelsRegistrationFailed: this.onSyncModelsRegistrationFailed.bind(this),
            onExternalSourceFailed: this.onSyncExternalSourceFailed.bind(this),
            onFilePushed: this.onSyncFilePushed.bind(this),
            onFileUpdated: this.onSyncFileUpdated.bind(this),
        });
    }

    protected async bootSync(): Promise<void> {
        await bootSync({
            models: this.syncModels,
            storageProvider: {
                getSetupCompleted: () => this.ready,
                setSetupCompleted: (ready) => this.setReady(ready),
                getContainerUrls: () => this.containerUrls,
                setContainerUrls: (containerUrls) => (this.containerUrls = containerUrls),
                getExternalSources: () => this.externalSources,
                setExternalSources: (externalSources) => (this.externalSources = externalSources),
            },
        });
    }

    protected async beforeLogout(): Promise<void> {
        await Sync.session?.disconnect({ reset: true });
    }

    protected logout(): void {
        this.setState({ ...this.getInitialState(), manualSetup: this.manualSetup });
    }

    protected watchLocalChanges(): void {
        watch(useLocalChanges().count, (count) => (this.localChangesCount = count), { immediate: true });
    }

    protected initializeTrackedModels(modelClass: ModelConstructor, register: true | RegisterOptions): void {
        trackModels(modelClass, { depth: typeof register === 'object' ? register.depth : undefined });
    }

    private async onSyncUpdated(changes: Partial<SyncProperties>): Promise<void> {
        if (changes.activeJob !== undefined) {
            this.syncJob = changes.activeJob;
        }

        if ('error' in changes) {
            this.syncError = changes.error;
        }

        if (!this.syncInProgress) {
            this.status = this.getCloudStatus();
        }
    }

    private async setReady(ready: boolean): Promise<void> {
        const becameReady = ready && !this.ready;

        this.ready = ready;

        if (becameReady) {
            await Events.emit('cloud:ready');
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
        await Events.emit('cloud:sync-completed');
    }

    private async onSyncFailed(error: unknown): Promise<void> {
        if (isTesting()) {
            return;
        }

        await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
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

    private getRegisteredFiles(modelClass: ModelConstructor): CloudFiles | undefined {
        const registration = getCloudRegistration(modelClass);

        return typeof registration === 'object' ? registration.files : undefined;
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

            await this.track(modelClass, { register: getCloudRegistration(modelClass) });
        }
    }

    private async refreshTrackedModels(): Promise<void> {
        for (const modelClass of getBootedModels().values()) {
            if (isCoreModel(modelClass) || getCloudRegistration(modelClass) === false) {
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
