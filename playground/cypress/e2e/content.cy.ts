describe('Formatted Content', () => {

    beforeEach(() => cy.visit('/content'));

    it('Shows formatted content', () => {
        cy.intercept('http://placekitten.com/600/300', { fixture: 'kitten.jpg' });

        cy.see('This is an example');
        cy.see('bold', 'strong');
        cy.see('italic', 'em');
        cy.see('code', 'code');
        cy.see('One', 'li');
        cy.see('Three', 'li');
        cy.seeImage('A cute kitten');

        cy.matchImageSnapshot();
    });

});
