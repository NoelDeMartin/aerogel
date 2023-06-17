describe('Forms', () => {

    beforeEach(() => cy.visit('/forms'));

    it('Uses forms', () => {
        cy.ariaInput('Name').type('Walter White{enter}');

        cy.see('Hello, Walter White!');
    });

});
