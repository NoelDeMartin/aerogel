import { defineServiceState } from '@aerogel/core';
import { Solid } from '@aerogel/plugin-solid';
import { map } from '@noeldemartin/utils';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel, SolidModelConstructor } from 'soukai-solid';

export const CloudStatus = {
    Disconnected: 'disconnected',
    Online: 'online',
    Syncing: 'syncing',
} as const;

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export interface CloudHandlerConfig<T extends SolidModel = SolidModel> {
    modelClass: SolidModelConstructor<T>;
    registerFor?: SolidModelConstructor | SolidModelConstructor[];
    getLocalModels(): T[];
}

export default defineServiceState({
    name: 'cloud',
    persist: ['ready'],
    initialState: () => ({
        dirtyRemoteModels: map([], 'url') as ObjectsMap<SolidModel>,
        handlers: new Map() as Map<SolidModelConstructor, CloudHandlerConfig>,
        localModelUpdates: {} as Record<string, number>,
        ready: false,
        remoteOperationUrls: {} as Record<string, string[]>,
        setupDismissed: false,
        status: CloudStatus.Disconnected as TCloudStatus,
    }),
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        syncing: ({ status }) => status === CloudStatus.Syncing,
        setupPending: ({ ready, setupDismissed }) => Solid.isLoggedIn() && !ready && !setupDismissed,
    },
});
