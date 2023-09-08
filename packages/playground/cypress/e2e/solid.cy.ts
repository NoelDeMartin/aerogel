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

    it('Logs in', () => {
        cy.ariaInput('Login url').type(`${cssPodUrl()}{enter}`);

        cssAuthorize();

        cy.see('You are logged in');
        cy.see(cssPodUrl('/alice/profile/card#me'));
    });

});
