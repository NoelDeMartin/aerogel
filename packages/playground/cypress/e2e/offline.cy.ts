import { cssPodUrl, cyCssLogin } from '@cy/support/community-solid-server';

describe('Offline', () => {

    beforeEach(() => cy.visit('/offline'));

    it('works', () => {
        cy.intercept('PATCH', cssPodUrl('/alice/tasks/*')).as('updateTask');
        cy.intercept('DELETE', cssPodUrl('/alice/tasks/*')).as('deleteTask');

        // Log in
        cy.ariaInput('Login url').type(`${cssPodUrl()}{enter}`);
        cyCssLogin();
        cy.see('You are logged in');
        cy.see(cssPodUrl('/alice/profile/card#me'));

        // Creates local tasks
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.see('Hello World!');
        cy.ariaInput('Task name').type('It works!{enter}');
        cy.see('It works!');

        cy.get('@updateTask.all').should('have.length', 0);

        // Sync tasks
        cy.press('Sync');
        cy.see('Syncing...');
        cy.dontSee('Syncing...');

        cy.get('@updateTask.all').should('have.length', 2);
        cy.get('@updateTask.1').its('request.body').should('contain', 'Hello World!');
        cy.get('@updateTask.2').its('request.body').should('contain', 'It works!');

        // Deletes local tasks
        cy.ariaLabel('Delete \'It works!\'').click();
        cy.dontSee('It works!');

        cy.get('@deleteTask.all').should('have.length', 0);

        // Sync tasks
        cy.press('Sync');
        cy.see('Syncing...');
        cy.dontSee('Syncing...');

        cy.get('@deleteTask.all').should('have.length', 0);
        cy.get('@updateTask.all').should('have.length', 3);
        cy.get('@updateTask.3').its('request.body').should('contain', 'Tombstone');
    });

});