import { Errors, defineServiceState } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import { arrayFilter } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { getBootedModels, getExternalSourceUrl } from 'soukai-bis';
import type { ExternalSource, ModelConstructor, Sync } from 'soukai-bis';

type PersistedExternalSource =
    | { containerUrl: string; instanceUrl?: undefined; modelNames: string[] }
    | { instanceUrl: string; containerUrl?: undefined; modelNames: string[] };

function serializeExternalSource(source: ExternalSource): PersistedExternalSource {
    const modelNames = source.models.map((model) => model.modelName);

    return source.containerUrl !== undefined
        ? { containerUrl: source.containerUrl, modelNames }
        : { instanceUrl: source.instanceUrl, modelNames };
}

function restoreExternalSource(source: PersistedExternalSource): ExternalSource | null {
    const bootedModels = getBootedModels();
    const models = arrayFilter(source.modelNames.map((modelName) => bootedModels.get(modelName)));
    const externalSource: ExternalSource =
        source.containerUrl !== undefined
            ? { containerUrl: source.containerUrl, models }
            : { instanceUrl: source.instanceUrl, models };

    if (models.length !== source.modelNames.length) {
        void Errors.report(
            new Error(
                `Dropping external source ${getExternalSourceUrl(externalSource)}, some of its models aren't booted ` +
                    `(${source.modelNames.join(', ')})`,
            ),
        );

        return null;
    }

    return externalSource;
}

export const CloudStatus = {
    Disconnected: 'disconnected',
    Offline: 'offline',
    Online: 'online',
    Syncing: 'syncing',
} as const;

export interface ModelRegistration {
    modelClass: ModelConstructor;
    path?: string;
    public?: boolean;
    singleton?: boolean;
}

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export const DEFAULT_STATE = { manualSetup: false };

export default defineServiceState({
    name: 'cloud',
    persist: [
        'localModelUpdates',
        'defaultContainerUrls',
        'registeredContainerUrls',
        'unregisteredContainerUrls',
        'registeredInstanceUrls',
        'pollingEnabled',
        'pollingMinutes',
        'ready',
        'startupSync',
        'externalSources',
    ],
    initialState: () => ({
        autoPush: true,
        localModelUpdates: {} as Record<string, number>,
        defaultContainerUrls: {} as Record<string, string>,
        registeredContainerUrls: {} as Record<string, string[]>,
        unregisteredContainerUrls: {} as Record<string, string[]>,
        registeredInstanceUrls: {} as Record<string, string[]>,
        pollingEnabled: true,
        pollingMinutes: 10,
        ready: false,
        manualSetup: DEFAULT_STATE.manualSetup,
        registeredModels: [] as ModelRegistration[],
        setupDismissed: false,
        setupOngoing: false,
        startupSync: true,
        externalSources: [] as ExternalSource[],
        status: CloudStatus.Disconnected as TCloudStatus,
        syncError: null as Nullable<ErrorSource>,
        syncJob: null as Nullable<Sync>,
    }),
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        offline: ({ status }) => status === CloudStatus.Offline,
        syncing: ({ status }) => status === CloudStatus.Syncing,
        localChanges({ localModelUpdates }) {
            return Object.values(localModelUpdates).reduce((total, count) => total + count, 0);
        },
        dirty(): boolean {
            return this.localChanges > 0;
        },
    },
    serialize: ({ externalSources, ...state }) => ({
        ...state,
        ...(externalSources && { externalSources: externalSources.map(serializeExternalSource) }),
    }),
    restore: ({ externalSources, ...state }) => ({
        ...state,
        ...(externalSources && { externalSources: arrayFilter(externalSources.map(restoreExternalSource)) }),
    }),
});
