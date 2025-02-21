import { defineServiceState } from '@aerogel/core';
import { map } from '@noeldemartin/utils';
import type { ErrorSource } from '@aerogel/core';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel, SolidModelConstructor } from 'soukai-solid';

export const CloudStatus = {
    Disconnected: 'disconnected',
    Online: 'online',
    Syncing: 'syncing',
    Migrating: 'migrating',
} as const;

export interface ModelRegistration {
    modelClass: SolidModelConstructor;
    path?: string;
}

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export default defineServiceState({
    name: 'cloud',
    persist: ['ready', 'modelCollections', 'startupSync', 'pollingEnabled', 'pollingMinutes'],
    initialState: () => ({
        autoPush: true,
        dirtyRemoteModels: map([], 'url') as ObjectsMap<SolidModel>,
        localModelUpdates: {} as Record<string, number>,
        ready: false,
        modelCollections: {} as Record<string, string[]>,
        registeredModels: [] as ModelRegistration[],
        remoteOperationUrls: {} as Record<string, string[]>,
        setupDismissed: false,
        startupSync: true,
        status: CloudStatus.Disconnected as TCloudStatus,
        syncError: null as ErrorSource | null,
        pollingEnabled: true,
        pollingMinutes: 10,
    }),
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        syncing: ({ status }) => status === CloudStatus.Syncing,
        localChanges({ localModelUpdates }) {
            return Object.values(localModelUpdates).reduce((total, count) => total + count, 0);
        },
        dirty(): boolean {
            return this.localChanges > 0;
        },
    },
});
