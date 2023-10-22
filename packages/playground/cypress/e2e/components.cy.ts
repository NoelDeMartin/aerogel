describe('Components', () => {

    beforeEach(() => cy.visit('/components'));

    it('All', () => {
        cy.matchImageSnapshot('Components 1');
        cy.contains('h2', 'Snackbars').scrollIntoView();
        cy.matchImageSnapshot('Components 2');
    });

    it('Modals', () => {
        cy.press('Custom alert');
        cy.see('How\'s your day going?');
        cy.matchImageSnapshot('Alert');
        cy.get('body').type('{esc}');
        cy.dontSee('How\'s your day going?');

        cy.press('Custom confirm');
        cy.see('Are you sure?');
        cy.matchImageSnapshot('Confirm');
        cy.press('OK');
        cy.see('Confirmed');
        cy.dontSee('Are you sure?');
        cy.get('body').type('{esc}');

        cy.press('Custom confirm');
        cy.see('Are you sure?');
        cy.press('Cancel');
        cy.see('Cancelled');
        cy.dontSee('Are you sure?');
        cy.get('body').type('{esc}');

        cy.press('Custom loading');
        cy.see('Loading...');
        cy.dontSee('Loading...');

        cy.press('Nested');
        cy.see('Open one more');
        cy.press('Open one more');
        cy.see('Hi there!');
        cy.matchImageSnapshot('Nested');
        cy.get('body').type('{esc}');
        cy.dontSee('Hi there!');
        cy.see('Open one more');
        cy.get('body').type('{esc}');
        cy.dontSee('Open one more');

        cy.press('Custom component');
        cy.see('You can also create your own modals');
        cy.matchImageSnapshot('Custom');
        cy.press('Nice!');
        cy.dontSee('You can also create your own modals');
    });

    it('Snackbars', () => {
        cy.contains('h2', 'Snackbars')
            .parent('section')
            .within(() => {
                cy.press('Custom');
                cy.press('Default');
                cy.press('Custom with actions');
                cy.press('Default with actions');
                cy.press('Custom danger');
                cy.press('Default danger');
                cy.press('Custom danger with actions');
                cy.press('Default danger with actions');
            });

        cy.matchImageSnapshot();
    });

});
