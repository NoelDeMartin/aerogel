describe('Modals', () => {

    beforeEach(() => cy.visit('/modals'));

    it('Uses modals', () => {
        cy.press('Show alert');
        cy.see('How\'s your day going?');
        cy.get('body').type('{esc}');
        cy.dontSee('How\'s your day going?');

        cy.press('Show confirm');
        cy.see('Are you sure?');
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

        cy.press('Show custom');
        cy.see('You can also create your own modals');
        cy.press('Nice!');
        cy.dontSee('You can also create your own modals');
    });

});
