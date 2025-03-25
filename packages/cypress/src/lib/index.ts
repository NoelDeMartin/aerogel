import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command.js';
import { setupSolidSupport } from 'cypress-solid';

import addCustomCommands from '@aerogel/cypress/lib/commands';
import addCustomQueries from '@aerogel/cypress/lib/queries';
import { setupErrorListener } from '@aerogel/cypress/lib/lib/errors';

export * from '@aerogel/cypress/lib/commands';
export * from '@aerogel/cypress/lib/queries';
export * from 'cypress-solid';

export function setupAerogelSupport(): void {
    addMatchImageSnapshotCommand();
    setupSolidSupport();
    setupErrorListener();
    addCustomCommands();
    addCustomQueries();
}
