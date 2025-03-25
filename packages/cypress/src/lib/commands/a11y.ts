export type SeeOptions = Partial<
    Cypress.Timeoutable & {
        srOnly: boolean;
    }
>;

export function dontSee(text: string, options?: Cypress.Timeoutable): void {
    cy.contains(text, options).should('not.exist');
}

export function press(
    label: string,
    selector: string = 'button:visible, a:visible, label:visible, details:visible',
): void {
    cy.contains(selector, label).click();
}

export function see<E extends Node = HTMLElement>(text: string, options?: SeeOptions): Cypress.Chainable<JQuery<E>>;
export function see<E extends Node = HTMLElement>(
    text: string,
    selector: string,
    options?: SeeOptions
): Cypress.Chainable<JQuery<E>>;
export function see<E extends Node = HTMLElement>(
    text: string,
    selectorOrOptions: string | SeeOptions = {},
    options: SeeOptions = {},
): Cypress.Chainable<JQuery<E>> {
    const { srOnly, ...baseOptions } = typeof selectorOrOptions === 'string' ? options : selectorOrOptions;
    const element =
        typeof selectorOrOptions === 'string'
            ? cy.contains<E>(selectorOrOptions, text, baseOptions)
            : cy.a11yGet(text, baseOptions);

    return srOnly ? element.should('exist') : element.scrollIntoView().should('be.visible');
}

export function seeImage(text: string): void {
    cy.get(`img[alt="${text}"]`).scrollIntoView().should('be.visible');
}
