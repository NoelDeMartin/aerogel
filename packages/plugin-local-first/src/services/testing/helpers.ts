import { CloudService } from '@aerogel/plugin-local-first/services/Cloud';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import { Solid } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { CompleteSolidUserProfile } from '@noeldemartin/solid-utils';
import { invade } from '@noeldemartin/utils';
import type { ListenersManager } from '@noeldemartin/utils';
import { Sync } from 'soukai-bis';
import type {
    ExternalSource,
    FilePushedEvent,
    ModelConstructor,
    SyncConfig,
    SyncJobListener,
    SyncJobResult,
    TypeIndex,
} from 'soukai-bis';
import { vi } from 'vite-plus/test';

const invadedMethods = [
    'getSyncConfig',
    'logout',
    'migrateLocalUrls',
    'refreshLocalChanges',
    'serializePersistedState',
    'deserializePersistedState',
] as const;

export type InvadedCloud = ReturnType<typeof invade<CloudService, (typeof invadedMethods)[number]>>;

export const user: CompleteSolidUserProfile = {
    webId: 'https://alice.example/profile/card#me',
    shallow: false,
    cloakedDocumentUrls: [],
    publicTypeIndexUrls: [],
    privateTypeIndexUrls: [],
    storageUrls: ['https://alice.example/'],
    writableProfileUrl: 'https://alice.example/profile/card',
};

export function invadedCloud(cloud: CloudService = new CloudService()): InvadedCloud {
    return invade(cloud, [...invadedMethods]);
}

export function logIn(): void {
    Solid.setState({ session: { user, loginUrl: user.webId, authenticator: {} as Authenticator } });
}

export function fakeSync(
    cloud: InvadedCloud,
    options: {
        typeIndexes?: TypeIndex[];
        createdTypeIndex?: TypeIndex;
        failedRegistrations?: ModelConstructor[];
        failedExternalSources?: [ExternalSource, unknown][];
        onRun?: () => Promise<unknown>;
        pushedFiles?: FilePushedEvent[];
        syncedFileUrls?: string[];
    } = {},
): void {
    vi.spyOn(cloud, 'getSyncConfig').mockResolvedValue({
        userProfile: user,
        applicationModels: [],
        privateTypeIndexes: options.typeIndexes ?? [],
    } as unknown as SyncConfig);
    vi.spyOn(Sync.prototype as unknown as { run(): Promise<SyncJobResult> }, 'run').mockImplementation(async function (
        this: Sync,
    ) {
        const { _listeners: listeners } = this as unknown as { _listeners: ListenersManager<SyncJobListener> };

        await options.onRun?.();

        if (options.createdTypeIndex) {
            await listeners.emit('onModelsRegistered', {
                typeIndex: options.createdTypeIndex,
                models: [Post],
                mode: 'container',
            });
        }

        if (options.failedRegistrations) {
            await listeners.emit('onModelsRegistrationFailed', {
                models: options.failedRegistrations,
                error: new Error('Registration failed'),
                mode: 'container',
            });
        }

        for (const [source, error] of options.failedExternalSources ?? []) {
            await listeners.emit('onExternalSourceFailed', source, error);
        }

        for (const pushedFile of options.pushedFiles ?? []) {
            this.syncedFileUrls.add(pushedFile.url);

            await listeners.emit('onFilePushed', pushedFile);
        }

        for (const url of options.syncedFileUrls ?? []) {
            this.syncedFileUrls.add(url);
        }

        return { syncedDocumentUrls: new Set(), documentsWithErrors: new Set(), syncedFileUrls: new Set() };
    });
}
