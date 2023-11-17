export function fixtureWithReplacements(
    filename: string,
    replacements: Record<string, unknown>,
): Cypress.Chainable<string> {
    return cy.fixture(filename).then((text) => {
        return Object.entries(replacements).reduce(
            (renderedText, [name, value]) => renderedText.replaceAll(`{{${name}}}`, value),
            text,
        );
    });
}
