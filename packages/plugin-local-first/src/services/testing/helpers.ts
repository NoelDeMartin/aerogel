import { CloudService } from '@aerogel/plugin-local-first/services/Cloud';
import { Solid } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { CompleteSolidUserProfile } from '@noeldemartin/solid-utils';
import { invade } from '@noeldemartin/utils';
import type { ListenersManager } from '@noeldemartin/utils';
import { SyncJob, TypeIndex, TypeRegistration } from 'soukai-bis';
import type {
    ExternalSource,
    FilePushedEvent,
    ModelConstructor,
    ModelContainerUrls,
    ModelWithUrl,
    SyncJobListener,
    SyncJobResult,
} from 'soukai-bis';
import { vi } from 'vite-plus/test';

const invadedMethods = [
    'beforeLogout',
    'deserializePersistedState',
    'getSyncModel',
    'login',
    'logout',
    'resolveConflict',
    'bootSync',
    'serializePersistedState',
    'track',
    'watchLocalChanges',
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

export async function connect(
    cloud: InvadedCloud,
    state: { ready?: boolean; containerUrls?: Record<string, ModelContainerUrls> } = {},
): Promise<void> {
    logIn();
    vi.stubGlobal('navigator', { userAgent: navigator.userAgent, onLine: true });

    cloud.setState({
        autoPush: false,
        ready: true,
        ...state,
    });

    await cloud.bootSync();
    await cloud.login();
}

export function fakeTypeIndex(registrations: [ModelConstructor, string][] = []): ModelWithUrl<TypeIndex> {
    const typeIndex = new TypeIndex({ url: 'https://alice.example/settings/privateTypeIndex' }, { exists: true });

    typeIndex.relatedRegistrations.related = registrations.map(
        ([modelClass, instanceContainer]) =>
            new TypeRegistration({
                forClass: modelClass.getRDFClasses(),
                instanceContainer,
            }),
    );

    return typeIndex as ModelWithUrl<TypeIndex>;
}

export function fakeSync(
    options: {
        typeIndexes?: TypeIndex[];
        failedExternalSources?: [ExternalSource, unknown][];
        failedRegistrations?: ModelConstructor[];
        error?: Error;
        pushedFiles?: FilePushedEvent[];
        syncedFileUrls?: string[];
        onRun?: () => unknown;
    } = {},
): void {
    vi.spyOn(Solid.requireInstance(), 'findTypeIndexes').mockResolvedValue({
        publicTypeIndexes: [],
        privateTypeIndexes: (options.typeIndexes ?? []) as ModelWithUrl<TypeIndex>[],
    });
    vi.spyOn(SyncJob.prototype as unknown as { run(): Promise<SyncJobResult> }, 'run').mockImplementation(
        async function (this: SyncJob) {
            const { _listeners: listeners } = this as unknown as { _listeners: ListenersManager<SyncJobListener> };

            await options.onRun?.();

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

            if (options.error) {
                this.completed.catch(() => null);

                throw options.error;
            }

            return { syncedDocumentUrls: new Set(), documentsWithErrors: new Set(), syncedFileUrls: new Set() };
        },
    );
}
