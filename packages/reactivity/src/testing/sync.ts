import { bootSync } from '@aerogel/reactivity/lib/sync';
import { Sync } from 'soukai-bis';
import type {
    ModelConstructor,
    ModelContainerUrls,
    SyncApplicationModel,
    SyncSession,
    SyncStorageProvider,
    UserProfileManager,
} from 'soukai-bis';

const user: ReturnType<UserProfileManager['getProfile']> = {
    webId: 'https://alice.example/profile/card#me',
    shallow: false,
    cloakedDocumentUrls: [],
    publicTypeIndexUrls: [],
    privateTypeIndexUrls: [],
    storageUrls: ['https://alice.example/'],
    writableProfileUrl: 'https://alice.example/profile/card',
};

function testingStorageProvider(containerUrls: Record<string, ModelContainerUrls> = {}): SyncStorageProvider {
    return {
        getSetupCompleted: () => false,
        setSetupCompleted: () => null,
        getContainerUrls: () => containerUrls,
        setContainerUrls: () => null,
        getExternalSources: () => [],
        setExternalSources: () => null,
    };
}

export async function bootTestingSync(
    model: ModelConstructor,
    containerUrls: Partial<ModelContainerUrls> & { default: string },
): Promise<void> {
    await bootSync({
        storageProvider: testingStorageProvider({
            [model.modelName]: { registered: [], unlisted: [], instances: [], ...containerUrls },
        }),
        models: [{ model, registration: true }],
    });
}

export async function connectTestingSync(models: SyncApplicationModel[] = []): Promise<SyncSession> {
    await bootSync({ storageProvider: testingStorageProvider(), models });

    return Sync.connect({ profileManager: { getProfile: () => user }, online: true, autoPush: false });
}
