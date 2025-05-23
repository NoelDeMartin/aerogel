import { podUrl, serverUrl } from '@aerogel/cypress';
import { urlClean } from '@noeldemartin/utils';

describe('Solid', () => {

    beforeEach(() => {
        cy.solidReset();
        cy.visit('/solid');
    });

    it('Manipulates Tasks', () => {
        cy.intercept('PATCH', podUrl('/tasks/*')).as('updateTask');
        cy.intercept('DELETE', podUrl('/tasks/*')).as('deleteTask');

        // Log in
        cy.ariaInput('Login url').type(`${urlClean(serverUrl(), { protocol: false })}{enter}`);
        cy.solidLogin();
        cy.see('You are logged in as Alice Cooper!');

        // Creates tasks
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.see('Hello World!');
        cy.ariaInput('Task name').type('It works!{enter}');
        cy.see('It works!');

        cy.get('@updateTask.all').should('have.length', 2);
        cy.get('@updateTask.1').its('request.body').should('contain', 'Hello World!');
        cy.get('@updateTask.2').its('request.body').should('contain', 'It works!');

        cy.matchImageSnapshot();

        // Deletes tasks
        cy.ariaLabel('Delete \'It works!\'').click();
        cy.dontSee('It works!');

        cy.get('@deleteTask.all').should('have.length', 1);

        // Log out
        cy.press('logout');
        cy.contains('[role="dialog"]', 'Log out from this device?').within(() => {
            cy.press('Log out');
        });

        cy.dontSee('Logging out');
        cy.visit('/solid');
        cy.dontSee('You are logged in');
        cy.see('Log in');
    });

});
