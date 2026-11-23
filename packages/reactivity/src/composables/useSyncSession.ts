import { syncSessionState } from '@aerogel/reactivity/internals/sync';
import type { ExternalSource, ModelContainerUrls, SyncJob } from 'soukai-bis';
import { shallowReadonly } from 'vue';

export interface SyncSessionState {
    connected: boolean;
    online: boolean;
    syncing: boolean;
    error: unknown;
    setupCompleted: boolean;
    activeJob: SyncJob | null;
    containerUrls: Record<string, ModelContainerUrls>;
    externalSources: ExternalSource[];
}

export function useSyncSession(): Readonly<SyncSessionState> {
    return shallowReadonly(syncSessionState);
}
