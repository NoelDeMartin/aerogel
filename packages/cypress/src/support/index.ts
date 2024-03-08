import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';
import { setupSolidSupport } from 'cypress-solid';

import addCustomCommands from '@/support/commands';
import addCustomQueries from '@/support/queries';
import { setupErrorListener } from '@/support/lib/errors';

export * from '@/support/commands';
export * from '@/support/queries';
export * from 'cypress-solid';

export function setupAerogelSupport(): void {
    addMatchImageSnapshotCommand();
    setupSolidSupport();
    setupErrorListener();
    addCustomCommands();
    addCustomQueries();
}
