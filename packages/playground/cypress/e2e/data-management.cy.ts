describe('Data Management', () => {

    beforeEach(() => cy.visit('/'));

    it('Creates tasks', () => {
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.see('Hello World!');
    });

    it('Deletes tasks', () => {
        cy.ariaInput('Task name').type('Hello World!{enter}');
        cy.ariaLabel('Delete \'Hello World!\'').click();
        cy.dontSee('Hello World!');
    });

});
