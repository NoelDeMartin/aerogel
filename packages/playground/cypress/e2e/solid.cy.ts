import { cssPodUrl } from '@aerogel/cypress';

describe('Solid', () => {

    beforeEach(() => {
        cy.resetSoukai();
        cy.resetSolid();
        cy.visit('/solid');
    });

    it('Manipulates Tasks', () => {
        cy.intercept('PATCH', cssPodUrl('/alice/tasks/*')).as('updateTask');
        cy.intercept('DELETE', cssPodUrl('/alice/tasks/*')).as('deleteTask');

        // Log in
        cy.ariaInput('Login url').type(`${cssPodUrl()}{enter}`);
        cy.cssLogin();
        cy.see('You are logged in');
        cy.see(cssPodUrl('/alice/profile/card#me'));

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
        cy.contains('[role="dialog"]', 'Are you sure you want to log out?').within(() => {
            cy.press('OK');
        });
        cy.dontSee('You are logged in');
        cy.see('Login');
    });

});
