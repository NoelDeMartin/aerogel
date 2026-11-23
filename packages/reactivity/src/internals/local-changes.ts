import { config } from '@aerogel/reactivity/internals/config';
import { getEngine, isLocalEngine } from 'soukai-bis';
import type { LocalEngine } from 'soukai-bis';
import { ref } from 'vue';

export const localChangesCount = ref(0);

let listenedEngine: LocalEngine | null = null;
let stopListening: (() => void) | null = null;
let lastRefreshId = 0;

async function refreshLocalChangesCount(engine: LocalEngine): Promise<void> {
    const refreshId = ++lastRefreshId;
    const changesets = await engine.getLocalChangesets();

    if (refreshId !== lastRefreshId) {
        return;
    }

    localChangesCount.value = changesets.length;
}

function refreshOrReport(engine: LocalEngine): void {
    refreshLocalChangesCount(engine).catch((error) => config.reportError(error));
}

export function listenLocalChanges(): void {
    const engine = getEngine();
    const localEngine = engine && isLocalEngine(engine) ? engine : null;

    if (localEngine === listenedEngine) {
        return;
    }

    resetLocalChanges();

    if (!localEngine) {
        return;
    }

    listenedEngine = localEngine;
    stopListening = localEngine.listeners.add({ onLocalChangesUpdated: () => refreshOrReport(localEngine) });

    refreshOrReport(localEngine);
}

export function resetLocalChanges(): void {
    stopListening?.();

    stopListening = null;
    listenedEngine = null;
    lastRefreshId++;
    localChangesCount.value = 0;
}
