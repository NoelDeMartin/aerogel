describe('Content', () => {

    beforeEach(() => cy.visit('/content'));

    it('Shows formatted content', () => {
        cy.see('This is an example');
        cy.see('bold', 'strong');
        cy.see('italic', 'em');
        cy.see('code', 'code');
        cy.see('One', 'li');
        cy.see('Three', 'li');
        cy.seeImage('A cute kitten');
    });

});
