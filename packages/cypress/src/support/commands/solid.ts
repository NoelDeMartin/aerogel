import { normalizeSparql } from '@noeldemartin/solid-utils';
import type { GetClosureArgs } from '@noeldemartin/utils';

import { cssPodUrl, cssUrl } from '@/support/solid';

export function createSolidDocument(path: string, fixture: string): void {
    cy.fixture(fixture).then((body) =>
        cy.solidRequest(cssPodUrl(path), {
            method: 'PUT',
            headers: { 'Content-Type': 'text/turtle' },
            body,
        }));
}

export function createSolidContainer(path: string, name: string): void {
    const containerUrl = cssPodUrl(path);

    cy.solidRequest(containerUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'If-None-Match': '*',
        },
    });

    cy.solidRequest(`${containerUrl}.meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/sparql-update' },
        body: `INSERT DATA { <${containerUrl}> <http://www.w3.org/2000/01/rdf-schema#label> "${name}" . }`,
    });
}

export function cssLogin(): void {
    cy.origin(cssUrl(), () => {
        cy.get('#email').type('alice@example.com');
        cy.get('#password').type('secret');
        cy.contains('button', 'Log in').click();
        cy.contains('http://localhost:4000/alice/profile/card#me');

        // TODO wait for proper event
        cy.wait(200);

        cy.contains('button', 'Authorize').click();
    });

    cy.waitForReload();
}

export function solidReset(): void {
    cy.task('solidReset');
}

export function solidRequest(...args: GetClosureArgs<typeof fetch>): Cypress.Chainable<Response> {
    return cy.task<Response>('solidRequest', args);
}

export function updateSolidDocument(path: string, fixture: string, replacements: Record<string, string> = {}): void {
    cy.fixture(fixture).then((body) =>
        cy.solidRequest(cssPodUrl(path), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/sparql-update' },
            body: normalizeSparql(
                Object.entries(replacements).reduce(
                    (renderedBody, [name, value]) => renderedBody.replaceAll(`{{${name}}}`, value),
                    body,
                ),
            ),
        }));
}
