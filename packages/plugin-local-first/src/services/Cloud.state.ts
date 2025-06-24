import { defineServiceState, replaceExisting, translateWithDefault } from '@aerogel/core';
import { Solid } from '@aerogel/plugin-solid';
import type { ErrorSource } from '@aerogel/core';
import type { Nullable } from '@noeldemartin/utils';
import type { SolidModelConstructor, SolidSchemaDefinition } from 'soukai-solid';

import Migrate from '@aerogel/plugin-local-first/jobs/Migrate';
import type Sync from '@aerogel/plugin-local-first/jobs/Sync';

export const CloudStatus = {
    Disconnected: 'disconnected',
    Offline: 'offline',
    Online: 'online',
    Syncing: 'syncing',
    Migrating: 'migrating',
} as const;

export interface ModelRegistration {
    modelClass: SolidModelConstructor;
    path?: string;
}

export type TCloudStatus = (typeof CloudStatus)[keyof typeof CloudStatus];

export const DEFAULT_STATE = { manualSetup: true };

export default defineServiceState({
    name: 'cloud',
    persist: [
        'localModelUpdates',
        'migrationDismissed',
        'migrationJob',
        'modelCollections',
        'pollingEnabled',
        'pollingMinutes',
        'ready',
        'startupSync',
    ],
    initialState: () => ({
        autoPush: true,
        localModelUpdates: {} as Record<string, number>,
        migrationDismissed: false,
        migrationJob: null as Nullable<Migrate>,
        migrationPostponed: false,
        modelCollections: {} as Record<string, string[]>,
        pollingEnabled: true,
        pollingMinutes: 10,
        ready: false,
        manualSetup: DEFAULT_STATE.manualSetup,
        registeredModels: [] as ModelRegistration[],
        schemaMigrations: new Map<SolidModelConstructor, SolidModelConstructor | SolidSchemaDefinition>(),
        setupDismissed: false,
        setupOngoing: false,
        startupSync: true,
        status: CloudStatus.Disconnected as TCloudStatus,
        syncError: null as Nullable<ErrorSource>,
        syncJob: null as Nullable<Sync>,
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
        offline: ({ status }) => status === CloudStatus.Offline,
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
