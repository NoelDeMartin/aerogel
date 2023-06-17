export function dontSee(text: string): void {
    cy.contains(text).should('not.exist');
}

export function press(label: string, selector: string = 'button, a, label'): void {
    cy.contains(selector, label).click();
}

export function see(text: string, options?: Partial<Cypress.Timeoutable>): void;
export function see(text: string, selector: string, options?: Partial<Cypress.Timeoutable>): void;
export function see(
    text: string,
    selectorOrOptions: string | Partial<Cypress.Timeoutable> = {},
    options: Partial<Cypress.Timeoutable> = {},
): void {
    if (typeof selectorOrOptions === 'string') {
        cy.contains(selectorOrOptions, text, options).scrollIntoView().should('be.visible');

        return;
    }

    cy.a11yGet(text, selectorOrOptions).scrollIntoView().should('be.visible');
}

export function seeImage(text: string): void {
    cy.get(`img[alt="${text}"]`).scrollIntoView().should('be.visible');
}
