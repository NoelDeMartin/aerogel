import type { DiffSnapshotResult } from '@simonsmith/cypress-image-snapshot/types';

import { defineOverride } from './lib';

export const matchImageSnapshot = defineOverride<Cypress.Chainable['matchImageSnapshot']>((original, ...args) => {
    if (Cypress.env('SNAPSHOTS')) {
        return original(...args);
    }

    Cypress.log({ message: 'Snapshots disabled, set CYPRESS_SNAPSHOTS to enable' });

    return cy.wrap({ pass: true } as DiffSnapshotResult, { log: false });
});
