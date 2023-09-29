describe('Forms', () => {

    beforeEach(() => cy.visit('/forms'));

    it('Uses forms', () => {
        cy.see('Accept Terms & Conditions');
        cy.matchImageSnapshot();

        cy.ariaInput('Name').type('Walter White{enter}');

        cy.see('Hello, Walter White!');
    });

});
