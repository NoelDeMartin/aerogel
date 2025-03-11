import { defineServiceState, replaceExisting, translateWithDefault } from '@aerogel/core';
import { map } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import type { ErrorSource } from '@aerogel/core';
import type { Nullable, ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel, SolidModelConstructor, SolidSchemaDefinition } from 'soukai-solid';

import Migrate from '@/jobs/Migrate';
import type Sync from '@/jobs/Sync';

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
    persist: [
        'ready',
        'modelCollections',
        'startupSync',
        'pollingEnabled',
        'pollingMinutes',
        'migrationJob',
        'migrationDismissed',
    ],
    initialState: () => ({
        autoPush: true,
        dirtyRemoteModels: map([], 'url') as ObjectsMap<SolidModel>,
        localModelUpdates: {} as Record<string, number>,
        ready: false,
        modelCollections: {} as Record<string, string[]>,
        registeredModels: [] as ModelRegistration[],
        schemaMigrations: new Map<SolidModelConstructor, SolidModelConstructor | SolidSchemaDefinition>(),
        remoteOperationUrls: {} as Record<string, string[]>,
        setupDismissed: false,
        startupSync: true,
        status: CloudStatus.Disconnected as TCloudStatus,
        syncError: null as Nullable<ErrorSource>,
        pollingEnabled: true,
        pollingMinutes: 10,
        syncJob: null as Nullable<Sync>,
        migrationJob: null as Nullable<Migrate>,
        migrationDismissed: false,
        migrationPostponed: false,
    }),
    serialize: (state) => replaceExisting(state, { migrationJob: state.migrationJob?.serialize() }),
    restore: (state) =>
        replaceExisting(state, {
            migrationJob: state.migrationJob && Migrate.restore(state.migrationJob),
        }),
    watch: {
        migrationJob(migrationJob) {
            migrationJob?.listeners.add({ onUpdated: () => this.updatePersistedState('migrationJob') });
        },
    },
    computed: {
        disconnected: ({ status }) => status === CloudStatus.Disconnected,
        online: ({ status }) => status === CloudStatus.Online,
        syncing: ({ status }) => status === CloudStatus.Syncing,
        migrating: ({ status }) => status === CloudStatus.Migrating,
        localChanges({ localModelUpdates }) {
            return Object.values(localModelUpdates).reduce((total, count) => total + count, 0);
        },
        dirty(): boolean {
            return this.localChanges > 0;
        },
        migrationStarted({ migrationJob }): boolean {
            return !!migrationJob;
        },
        migrationDisabledReason({ status, ready }): string | null {
            if (!Solid.isLoggedIn()) {
                return translateWithDefault(
                    'cloud.migrationNotLoggedIn',
                    'You need to reconnect before starting the migration',
                );
            }

            if (!ready) {
                return translateWithDefault(
                    'cloud.migrationNotReady',
                    'You need to backup your data before starting the migration',
                );
            }

            if (status === CloudStatus.Syncing || status === CloudStatus.Migrating) {
                return translateWithDefault(
                    'cloud.migrationNotSyncing',
                    'Wait for syncing to finish before starting the migration',
                );
            }

            if (!this.online) {
                return translateWithDefault(
                    'cloud.migrationNotOnline',
                    'You need to be online in order to start the migration',
                );
            }

            return null;
        },
    },
});
