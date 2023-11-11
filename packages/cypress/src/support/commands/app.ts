export function waitForReload(): void {
    cy.get('#app.loading').should('exist');
    cy.get('#app.loading').should('not.exist');
}
