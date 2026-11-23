import { listenSyncSession } from '@aerogel/reactivity/internals/sync';
import { listenSync } from '@aerogel/reactivity/internals/tracking';
import { Sync } from 'soukai-bis';

export type SyncBootOptions = Parameters<typeof Sync.boot>[0];

export async function bootSync(options: SyncBootOptions): Promise<void> {
    await Sync.boot(options);

    listenSync();
    listenSyncSession();
}
