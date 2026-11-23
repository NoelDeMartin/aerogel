import type { SyncSessionState } from '@aerogel/reactivity/composables';
import { objectOnly } from '@noeldemartin/utils';
import { Sync } from 'soukai-bis';
import type { SyncSession } from 'soukai-bis';
import { shallowReactive } from 'vue';

export const syncSessionState = shallowReactive(initialSyncSessionState());

const SYNC_SESSION_STATE_KEYS: (keyof SyncSessionState)[] = [
    'connected',
    'online',
    'syncing',
    'error',
    'setupCompleted',
    'activeJob',
    'containerUrls',
    'externalSources',
];

let stopListening: (() => void) | null = null;

function initialSyncSessionState(): SyncSessionState {
    return {
        connected: false,
        online: false,
        syncing: false,
        error: null,
        setupCompleted: false,
        activeJob: null,
        containerUrls: {},
        externalSources: [],
    };
}

function getSyncSessionState(session: SyncSession | null): SyncSessionState {
    return {
        connected: session?.connected ?? false,
        online: session?.online ?? false,
        syncing: session?.syncing ?? false,
        error: session?.error ?? null,
        activeJob: session?.activeJob ?? null,
        setupCompleted: Sync.setupCompleted,
        containerUrls: Sync.containerUrls,
        externalSources: Sync.externalSources,
    };
}

export function listenSyncSession(): void {
    if (stopListening) {
        return;
    }

    stopListening = Sync.listeners.add({
        onSessionStarted: (session) => Object.assign(syncSessionState, getSyncSessionState(session)),
        onUpdated: (changes) => Object.assign(syncSessionState, objectOnly(changes, SYNC_SESSION_STATE_KEYS)),
        onSessionEnded: () => Object.assign(syncSessionState, getSyncSessionState(null)),
    });

    Object.assign(syncSessionState, getSyncSessionState(Sync.session));
}

export function resetSyncSession(): void {
    stopListening?.();

    stopListening = null;

    Object.assign(syncSessionState, initialSyncSessionState());
}
