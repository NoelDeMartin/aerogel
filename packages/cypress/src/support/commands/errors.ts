export function disableErrorHandling(): void {
    Cypress.on('window:before:load', (window) => {
        window.__aerogelDisableErrorHandling__ = true;
    });
}
