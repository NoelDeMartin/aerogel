describe('Components', () => {

    beforeEach(() => cy.visit('/components'));

    it('All', () => {
        // TODO wait fonts to load instead
        cy.wait(200);

        cy.matchImageSnapshot();
    });

    it('Modals', () => {
        cy.press('Alert');
        cy.see('How\'s your day going?');
        cy.matchImageSnapshot('Alert');
        cy.get('body').type('{esc}');
        cy.dontSee('How\'s your day going?');

        cy.press('Confirm');
        cy.see('You\'re about to do something dangerous');
        cy.see('Are you sure you want to continue?');
        cy.matchImageSnapshot('Confirm');
        cy.press('Of course!');
        cy.see('You were just eaten by a crocodile');
        cy.dontSee('Are you sure you want to continue?');
        cy.get('body').type('{esc}');

        cy.press('Confirm');
        cy.see('Are you sure you want to continue?');
        cy.press('Maybe not');
        cy.see('You dodged that bullet');
        cy.dontSee('Are you sure you want to continue?');
        cy.get('body').type('{esc}');

        cy.press('Loading');
        cy.see('The elfs are working, please wait...');
        cy.dontSee('The elfs are working, please wait...');

        cy.press('Nested');
        cy.see('Nested modal (1)');
        cy.see('Modals can be nested indefinitely');
        cy.press('When does this end?');
        cy.see('Nested modal (2)');
        cy.press('When does this end?');
        cy.see('Nested modal (3)');
        cy.matchImageSnapshot('Nested');
        cy.get('body').type('{esc}');
        cy.dontSee('Nested modal (3)');
        cy.get('body').type('{esc}');
        cy.dontSee('Nested modal (2)');
        cy.get('body').type('{esc}');
        cy.dontSee('Nested modal (1)');

        cy.press('Custom content');
        cy.see('You can also create your own modals');
        cy.matchImageSnapshot('Custom');
        cy.press('Nice!');
        cy.dontSee('You can also create your own modals');
    });

    it('Toasts', () => {
        cy.contains('h2', 'Toasts')
            .parent('section')
            .within(() => {
                cy.press('Default');
                cy.press('Default with actions');
                cy.press('Danger');
                cy.press('Danger with actions');
            });

        cy.matchImageSnapshot();
    });

});
