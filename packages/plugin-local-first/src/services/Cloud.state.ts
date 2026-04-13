import { defineServiceState } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import type { Nullable } from '@noeldemartin/utils';
import type { ModelConstructor, Sync } from 'soukai-bis';

export const CloudStatus = {
    Disconnected: 'disconnected',
    Offline: 'offline',
    Online: 'online',
    Syncing: 'syncing',
} as const;

export interface ModelRegistration {
    modelClass: ModelConstructor;
    path?: string;
}

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export const DEFAULT_STATE = { manualSetup: false };

export default defineServiceState({
    name: 'cloud',
    persist: [
        'localModelUpdates',
        'modelCollections',
        'rootModelCollections',
        'pollingEnabled',
        'pollingMinutes',
        'ready',
        'startupSync',
    ],
    initialState: () => ({
        autoPush: true,
        localModelUpdates: {} as Record<string, number>,
        modelCollections: {} as Record<string, string[]>,
        rootModelCollections: {} as Record<string, string>,
        pollingEnabled: true,
        pollingMinutes: 10,
        ready: false,
        manualSetup: DEFAULT_STATE.manualSetup,
        registeredModels: [] as ModelRegistration[],
        setupDismissed: false,
        setupOngoing: false,
        startupSync: true,
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
});
