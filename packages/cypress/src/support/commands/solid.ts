import { cssPodUrl } from '@/support/solid';
import type { GetClosureArgs } from '@noeldemartin/utils';

export function createSolidDocument(path: string, fixture: string): void {
    cy.fixture(fixture).then((body) =>
        cy.solidRequest(cssPodUrl(`/alice${path}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'text/turtle' },
            body,
        }));
}

export function createSolidContainer(path: string, name: string): void {
    cy.solidRequest(cssPodUrl(`/alice${path}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'If-None-Match': '*',
        },
        body: `<> <http://www.w3.org/2000/01/rdf-schema#label> "${name}" .`,
    });
}

export function cssLogin(): void {
    cy.origin(cssPodUrl(), () => {
        cy.get('#email').type('alice@example.com');
        cy.get('#password').type('secret');
        cy.contains('button', 'Log in').click();
        cy.contains('http://localhost:4000/alice/profile/card#me');

        // TODO wait for proper event
        cy.wait(200);

        cy.contains('button', 'Authorize').click();
    });
}

export function solidReset(): void {
    cy.task('solidReset');
}

export function solidRequest(...args: GetClosureArgs<typeof fetch>): Cypress.Chainable<Response> {
    return cy.task<Response>('solidRequest', args);
}

export function updateSolidDocument(path: string, fixture: string): void {
    cy.fixture(fixture).then((body) =>
        cy.solidRequest(cssPodUrl(`/alice${path}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/sparql-update' },
            body,
        }));
}
