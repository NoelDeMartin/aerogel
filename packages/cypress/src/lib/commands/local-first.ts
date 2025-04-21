export function waitSync(): void {
    cy.see('Synchronization in progress');
    cy.dontSee('Synchronization in progress');
}
