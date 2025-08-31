export function comboboxSelect(labelOrSelector: string, value: string): void {
    // Wait between clicks to avoid resize observer errors

    cy.wait(300);
    cy.contains('label[for]', labelOrSelector).then(($el) => {
        cy.get(`#${$el.attr('for')}`).click();
    });

    cy.wait(300);
    cy.press(value, '*[role="option"]');
}
