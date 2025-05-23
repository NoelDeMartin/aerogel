describe('Error Handling', () => {

    beforeEach(() => {
        cy.disableErrorHandling();
        cy.visit('/errors');
    });

    it('Handles runtime errors', () => {
        // Error with stack trace
        cy.press('Throw error');
        cy.ariaLabel('View error logs').click();
        cy.see('Errors (1)');
        cy.press('Close');
        cy.see('Something went wrong, but it\'s not your fault.');
        cy.ariaLabel('View details').click();
        cy.see('Copy to clipboard');
        cy.see('Log to console');
        cy.contains('a', 'Report in GitHub');
        cy.see('This error was thrown for testing purposes');
        cy.see('throwError');
        cy.see('Errors.vue');
        cy.focused().type('{esc}');
        cy.dontSee('Something went wrong, but it\'s not your fault.');

        // Error with no trace
        cy.press('Throw error (no trace)');
        cy.ariaLabel('View error logs').click();
        cy.see('Errors (2)');
        cy.contains('li', 'Test Error').within(() => cy.ariaLabel('View details').click());
        cy.contains('[role="dialog"]', 'Test Error');

        // All errors
        cy.see('Test Error (1/2)');
        cy.ariaLabel('Show next report').click();
        cy.see('Error (2/2)');
        cy.see('throwError');
        cy.see('Errors.vue');

        // Normalize stacktrace
        cy.get('[role="dialog"] pre').invoke('text', '[stacktrace]');
        cy.matchImageSnapshot();
    });

    it('Handles startup crashes', () => {
        cy.see('Test Startup Crash');
        cy.press('Test Startup Crash');
        cy.see('There was a problem starting the application');

        cy.matchImageSnapshot();

        cy.press('View error details');
        cy.see('This is an error caused during application startup');
    });

    it('Purges devices', () => {
        cy.model('LocalTask').then(async (LocalTask) => {
            await LocalTask.create({ name: 'For my next trick, I\'ll make you disappear' });
        });

        cy.model('LocalTask')
            .then((LocalTask) => LocalTask.all())
            .should('have.length', 1);

        cy.see('Test Startup Crash');
        cy.press('Test Startup Crash');
        cy.press('Purge device');
        cy.contains('[role="dialog"]', 'Delete everything').within(() => {
            cy.press('Purge device');
        });

        cy.see('Welcome to Aerogel!');

        cy.model('LocalTask')
            .then((LocalTask) => LocalTask.all())
            .should('have.length', 0);
    });

});
