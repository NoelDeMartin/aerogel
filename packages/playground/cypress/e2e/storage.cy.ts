describe('Storage', () => {

    beforeEach(() => {
        cy.resetSoukai();
        cy.visit('/storage');
    });

    it('Creates tasks', () => {
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.see('Hello World!');
        cy.ariaInput('Task name').type('It works!{enter}');
        cy.see('It works!');
        cy.matchImageSnapshot();
    });

    it('Deletes tasks', () => {
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.ariaLabel('Delete \'Hello World!\'').click();
        cy.dontSee('Hello World!');
    });

});
