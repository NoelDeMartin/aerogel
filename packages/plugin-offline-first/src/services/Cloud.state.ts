import { defineServiceState } from '@aerogel/core';
import { map } from '@noeldemartin/utils';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel, SolidModelConstructor } from 'soukai-solid';

export const CloudStatus = {
    Disconnected: 'disconnected',
    Online: 'online',
    Syncing: 'syncing',
} as const;

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export default defineServiceState({
    name: 'cloud',
    persist: ['ready', 'startupSync', 'pollingEnabled', 'pollingMinutes'],
    initialState: () => ({
        dirtyRemoteModels: map([], 'url') as ObjectsMap<SolidModel>,
        localModelUpdates: {} as Record<string, number>,
        ready: false,
        registeredModels: new Set<SolidModelConstructor>(),
        remoteOperationUrls: {} as Record<string, string[]>,
        setupDismissed: false,
        startupSync: false,
        status: CloudStatus.Disconnected as TCloudStatus,
        pollingEnabled: false,
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
