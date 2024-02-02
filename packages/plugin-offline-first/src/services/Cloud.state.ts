import { defineServiceState } from '@aerogel/core';
import { Solid } from '@aerogel/plugin-solid';
import { map } from '@noeldemartin/utils';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel } from 'soukai-solid';

export const CloudStatus = {
    Disconnected: 'disconnected',
    Online: 'online',
    Syncing: 'syncing',
} as const;

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export default defineServiceState({
    name: 'cloud',
    initialState: {
        dirtyRemoteModels: map([], 'url') as ObjectsMap<SolidModel>,
        localModelUpdates: {} as Record<string, number>,
        ready: false,
        remoteOperationUrls: {} as Record<string, string[]>,
        setupDismissed: false,
        status: CloudStatus.Disconnected as TCloudStatus,
    },
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        syncing: ({ status }) => status === CloudStatus.Syncing,
        setupPending: ({ ready, setupDismissed }) => Solid.isLoggedIn() && !ready && !setupDismissed,
    },
});
