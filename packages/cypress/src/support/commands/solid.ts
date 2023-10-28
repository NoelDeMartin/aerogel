export function cssLogin(): void {
    cy.get('#email').type('alice@example.com');
    cy.get('#password').type('secret');
    cy.contains('button', 'Log in').click();
    cy.see('http://localhost:4000/alice/profile/card#me');

    // TODO wait for proper event
    cy.wait(200);

    cy.contains('button', 'Authorize').click();
}

export function resetSolid(): void {
    cy.task('resetSolid');
}
