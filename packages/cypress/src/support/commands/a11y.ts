export type SeeOptions = Partial<
    Cypress.Timeoutable & {
        srOnly: boolean;
    }
>;

export function dontSee(text: string): void {
    cy.contains(text).should('not.exist');
}

export function press(label: string, selector: string = 'button, a, label'): void {
    cy.contains(selector, label).click();
}

export function see(text: string, options?: SeeOptions): void;
export function see(text: string, selector: string, options?: SeeOptions): void;
export function see(text: string, selectorOrOptions: string | SeeOptions = {}, options: SeeOptions = {}): void {
    const { srOnly, ...baseOptions } = typeof selectorOrOptions === 'string' ? options : selectorOrOptions;
    const element =
        typeof selectorOrOptions === 'string'
            ? cy.contains(selectorOrOptions, text, baseOptions)
            : cy.a11yGet(text, baseOptions);

    srOnly ? element.should('exist') : element.scrollIntoView().should('be.visible');
}

export function seeImage(text: string): void {
    cy.get(`img[alt="${text}"]`).scrollIntoView().should('be.visible');
}
