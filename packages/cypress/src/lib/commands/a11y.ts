import { uuid } from '@noeldemartin/utils';

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
    selector: string = 'button:visible, a:visible, label:visible, details:visible, [role="menuitem"]:visible',
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
    const id = uuid();
    const { srOnly, ...baseOptions } = typeof selectorOrOptions === 'string' ? options : selectorOrOptions;

    if (typeof selectorOrOptions === 'string') {
        cy.contains<E>(selectorOrOptions, text, baseOptions).as(id);
    } else {
        cy.a11yGet(text, baseOptions).as(id);
    }

    if (srOnly) {
        return cy.get<E>(`@${id}`).should('exist');
    }

    cy.get(`@${id}`).scrollIntoView();

    return cy.get<E>(`@${id}`).should('be.visible');
}

export function seeImage(text: string): void {
    const id = uuid();

    cy.get(`img[alt="${text}"]`).as(id).scrollIntoView();
    cy.get(`@${id}`).should('be.visible');
}
