import { appNamespace } from '@aerogel/core';
import { IndexedDBMap } from '@noeldemartin/utils';
import type { SerializedModel } from 'soukai-bis';

let persistedModels: IndexedDBMap<SerializedModel[]> | null = null;

export function getPersistedModels(): IndexedDBMap<SerializedModel[]> {
    return (persistedModels ??= new IndexedDBMap(`${appNamespace()}-computed-models`));
}

export async function clearPersistedModels(): Promise<void> {
    await getPersistedModels().clear();
}
