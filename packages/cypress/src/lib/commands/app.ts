import { fail } from '@noeldemartin/utils';

import type { AerogelTestingRuntime, Services } from '@aerogel/core';

export function testingRuntime(): Cypress.Chainable<AerogelTestingRuntime> {
    return cy
        .window()
        .its('testingRuntime')
        .then((runtime) => runtime ?? fail<AerogelTestingRuntime>('Testing runtime is missing'));
}

export function service<T extends keyof Services>(name: T): Cypress.Chainable<Services[T]> {
    return cy
        .testingRuntime()
        .then((runtime) => runtime.service(name) ?? fail<Services[T]>(`Service '${name}' not found`));
}

export function waitForReload(): void {
    cy.get('#app.loading').should('exist');
    cy.get('#app.loading').should('not.exist');
}
