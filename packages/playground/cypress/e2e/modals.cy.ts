describe('Modals', () => {

    beforeEach(() => cy.visit('/modals'));

    it('Uses modals', () => {
        cy.press('Default Modal');
        cy.see('Default modals are quite modest');
        cy.get('body').type('{esc}');
        cy.dontSee('Default modals are quite modest');

        cy.press('Custom Modal');
        cy.see('Custom modals can get as fancy as you want');
        cy.press('Cool!');
        cy.dontSee('Custom modals can get as fancy as you want');
    });

});
