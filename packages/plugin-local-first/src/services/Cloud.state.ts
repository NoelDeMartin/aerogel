import { Errors, defineServiceState } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import { arrayFilter } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { restoreExternalSource, serializeExternalSource } from 'soukai-bis';
import type {
    ExternalSource,
    FilesSyncStrategy,
    ModelContainerUrls,
    SerializedExternalSource,
    SyncJob,
} from 'soukai-bis';

function restoreExternalSourceOrReport(source: SerializedExternalSource): ExternalSource | null {
    try {
        return restoreExternalSource(source);
    } catch (error) {
        void Errors.report(error);

        return null;
    }
}

export const CloudStatus = {
    Disconnected: 'disconnected',
    Offline: 'offline',
    Online: 'online',
    Syncing: 'syncing',
} as const;

export interface CloudFilesConfig {
    strategy?: FilesSyncStrategy;
    fields?: string[];
    availableOffline?: boolean;
}

export type CloudFiles = boolean | FilesSyncStrategy | CloudFilesConfig | CloudFilesConfig[];

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export const DEFAULT_STATE = { manualSetup: false };

export default defineServiceState({
    name: 'cloud',
    persist: ['ready', 'containerUrls', 'externalSources', 'pollingEnabled', 'pollingMinutes', 'startupSync'],
    initialState: () => ({
        autoPush: true,
        localChangesCount: 0,
        containerUrls: {} as Record<string, ModelContainerUrls>,
        externalSources: [] as ExternalSource[],
        pollingEnabled: true,
        pollingMinutes: 10,
        ready: false,
        manualSetup: DEFAULT_STATE.manualSetup,
        setupDismissed: false,
        setupOngoing: false,
        startupSync: true,
        status: CloudStatus.Disconnected as TCloudStatus,
        syncError: null as Nullable<ErrorSource>,
        syncJob: null as Nullable<SyncJob>,
    }),
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        offline: ({ status }) => status === CloudStatus.Offline,
        syncing: ({ status }) => status === CloudStatus.Syncing,
        dirty: ({ localChangesCount }) => localChangesCount > 0,
    },
    serialize: ({ externalSources, ...state }) => ({
        ...state,
        ...(externalSources && { externalSources: externalSources.map(serializeExternalSource) }),
    }),
    restore: ({ externalSources, ...state }) => ({
        ...state,
        ...(externalSources && { externalSources: arrayFilter(externalSources.map(restoreExternalSourceOrReport)) }),
    }),
});
