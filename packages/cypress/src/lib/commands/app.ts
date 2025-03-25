import { fail } from '@noeldemartin/utils';

import type { AerogelTestingRuntime } from '@aerogel/core';

export function testingRuntime(): Cypress.Chainable<AerogelTestingRuntime> {
    return cy
        .window()
        .its('testingRuntime')
        .then((runtime) => runtime ?? fail<AerogelTestingRuntime>('Testing runtime is missing'));
}

export function waitForReload(): void {
    cy.get('#app.loading').should('exist');
    cy.get('#app.loading').should('not.exist');
}
