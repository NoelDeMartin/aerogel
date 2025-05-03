export function comboboxSelect(label: string, value: string): void {
    cy.contains('label[for]', label).then(($el) => {
        cy.get(`#${$el.attr('for')}`).click();
    });
    cy.press(value, '*[role="option"]');
}
