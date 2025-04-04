describe('Error Handling', () => {

    beforeEach(() => {
        cy.disableErrorHandling();
        cy.visit('/errors');
    });

    it('Handles runtime errors', () => {
        // Error with stack trace
        cy.press('Throw error');
        cy.see('See all (1)');
        cy.see('Something went wrong, but it\'s not your fault.');
        cy.press('View details');
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
        cy.see('See all (2)');
        cy.press('View details');
        cy.see('Test Error');
        cy.focused().type('{esc}');

        // All errors
        cy.press('See all (2)');
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
        cy.visit('?startupCrash=true'); // TODO call cy.press('Test Startup Crash'); instead
        cy.see('Something failed trying to start the application');

        cy.matchImageSnapshot();

        cy.press('View error details');
        cy.see('This is an error caused during application startup');
    });

});
