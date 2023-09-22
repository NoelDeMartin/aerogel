import { defineServiceState } from '@aerogel/core';
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
        status: CloudStatus.Disconnected as TCloudStatus,
        dirtyRemoteModels: map([], 'url') as ObjectsMap<SolidModel>,
        localModelUpdates: {} as Record<string, number>,
        remoteOperationUrls: {} as Record<string, string[]>,
    },
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        syncing: ({ status }) => status === CloudStatus.Syncing,
    },
});
