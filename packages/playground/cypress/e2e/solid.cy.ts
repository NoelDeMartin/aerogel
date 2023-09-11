function cssPodUrl(path: string = ''): string {
    return `http://localhost:4000${path}`;
}

function cssLogin() {
    cy.get('#email').type('alice@example.com');
    cy.get('#password').type('secret');
    cy.contains('button', 'Log in').click();
    cy.contains('button', 'Authorize').click();
}

function cssRegister() {
    cy.contains('Sign up').click();
    cy.get('#email').type('alice@example.com');
    cy.get('#password').type('secret');
    cy.get('#confirmPassword').type('secret');
    cy.get('#podName').type('alice');
    cy.contains('button', 'Sign up').click();
    cy.contains('a', 'log in').click();
}

function cssAuthorize(): void {
    const requestOptions = {
        url: cssPodUrl('/alice/profile/card'),
        failOnStatusCode: false,
    };

    cy.request(requestOptions).then(({ isOkStatusCode }) => {
        isOkStatusCode || cssRegister();

        cssLogin();
    });
}

describe('Solid', () => {

    beforeEach(() => cy.visit('/solid'));

    it('works', () => {
        cy.intercept('PATCH', cssPodUrl('/alice/tasks/*')).as('createTask');
        cy.intercept('DELETE', cssPodUrl('/alice/tasks/*')).as('deleteTask');

        // Log in
        cy.ariaInput('Login url').type(`${cssPodUrl()}{enter}`);

        // TODO reset POD on log in (remove previous tasks, etc.)
        cssAuthorize();

        cy.see('You are logged in');
        cy.see(cssPodUrl('/alice/profile/card#me'));

        // Creates tasks
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.see('Hello World!');
        cy.ariaInput('Task name').type('It works!{enter}');
        cy.see('It works!');

        cy.get('@createTask.all').should('have.length', 2);
        cy.get('@createTask.1').its('request.body').should('contain', 'Hello World!');
        cy.get('@createTask.2').its('request.body').should('contain', 'It works!');

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
