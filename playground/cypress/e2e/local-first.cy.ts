import { podUrl, serverUrl } from '@aerogel/cypress';
import { urlClean } from '@noeldemartin/utils';

describe('Local First', () => {

    beforeEach(() => {
        cy.solidReset();
        cy.visit('/local-first');
    });

    it('Manipulates Tasks', () => {
        cy.intercept('PATCH', podUrl('/tasks/*')).as('updateTask');
        cy.intercept('DELETE', podUrl('/tasks/*')).as('deleteTask');

        // Log in
        cy.ariaLabel('Configuration').click();
        cy.press('Connect account');
        cy.ariaInput('Login url').type(`${urlClean(serverUrl(), { protocol: false })}{enter}`);
        cy.solidLogin();
        cy.waitSync();
        cy.ariaLabel('Open account').click();
        cy.see('Alice Cooper');
        cy.get(':focus').type('{esc}');

        // Creates local tasks
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.see('Hello World!');
        cy.ariaInput('Task name').type('It works!{enter}');
        cy.see('It works!');

        cy.get('@updateTask.all').should('have.length', 0);

        // Sync tasks
        cy.waitSync();

        cy.get('@updateTask.all').should('have.length', 2);
        cy.get('@updateTask.1').its('request.body').should('contain', 'Hello World!');
        cy.get('@updateTask.2').its('request.body').should('contain', 'It works!');

        cy.matchImageSnapshot();

        // Deletes local tasks
        cy.ariaLabel('Delete \'It works!\'').click();
        cy.dontSee('It works!');

        cy.get('@deleteTask.all').should('have.length', 0);

        // Sync tasks
        cy.waitSync();

        cy.get('@deleteTask.all').should('have.length', 0);
        cy.get('@updateTask.all').should('have.length', 3);
        cy.get('@updateTask.3').its('request.body').should('contain', 'Tombstone');
    });

});
