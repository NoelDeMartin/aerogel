export function a11yGet(text: string, options: Partial<Cypress.Timeoutable> = {}): Cypress.Chainable {
    return cy.contains(text, options);
}

export function ariaInput(label: string): Cypress.Chainable {
    return cy.contains(label).then((matches) => {
        const labelElement = (matches as unknown as HTMLElement[])[0];
        const inputElement = labelElement?.querySelector('input, textarea');

        return inputElement ? cy.wrap(inputElement) : cy.get(`#${labelElement?.getAttribute('for')}`);
    });
}

export function ariaLabel(label: string): Cypress.Chainable {
    return cy.get(`[aria-label="${label}"]`);
}

export function dontSee(text: string): Cypress.Chainable {
    return cy.contains(text).should('not.exist');
}

export function press(label: string, selector: string = 'button, a, label'): void {
    cy.contains(selector, label).click();
}

export function see(text: string, options?: Partial<Cypress.Timeoutable>): Cypress.Chainable;
export function see(text: string, selector: string, options?: Partial<Cypress.Timeoutable>): Cypress.Chainable;
export function see(
    text: string,
    selectorOrOptions: string | Partial<Cypress.Timeoutable> = {},
    options: Partial<Cypress.Timeoutable> = {},
): Cypress.Chainable {
    return typeof selectorOrOptions === 'string'
        ? cy.contains(selectorOrOptions, text, options).scrollIntoView().should('be.visible')
        : cy.a11yGet(text, selectorOrOptions).scrollIntoView().should('be.visible');
}

export function seeImage(text: string): Cypress.Chainable {
    return cy.get(`img[alt="${text}"]`).scrollIntoView().should('be.visible');
}
