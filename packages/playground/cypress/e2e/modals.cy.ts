describe('Modals', () => {

    beforeEach(() => cy.visit('/modals'));

    it('Uses modals', () => {
        cy.press('Show alert');
        cy.see('How\'s your day going?');
        cy.matchImageSnapshot('Alert');
        cy.get('body').type('{esc}');
        cy.dontSee('How\'s your day going?');

        cy.press('Show confirm');
        cy.see('Are you sure?');
        cy.matchImageSnapshot('Confirm');
        cy.press('OK');
        cy.see('Confirmed');
        cy.dontSee('Are you sure?');
        cy.get('body').type('{esc}');

        cy.press('Show confirm');
        cy.see('Are you sure?');
        cy.press('Cancel');
        cy.see('Cancelled');
        cy.dontSee('Are you sure?');
        cy.get('body').type('{esc}');

        cy.press('Show loading');
        cy.see('Loading...');
        cy.dontSee('Loading...');

        cy.press('Show nested');
        cy.see('Open one more');
        cy.press('Open one more');
        cy.see('Hi there!');
        cy.matchImageSnapshot('Nested');
        cy.get('body').type('{esc}');
        cy.dontSee('Hi there!');
        cy.see('Open one more');
        cy.get('body').type('{esc}');
        cy.dontSee('Open one more');

        cy.press('Show custom');
        cy.see('You can also create your own modals');
        cy.matchImageSnapshot('Custom');
        cy.press('Nice!');
        cy.dontSee('You can also create your own modals');
    });

});
