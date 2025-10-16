import { isObject, toString } from '@noeldemartin/utils';

const knownErrors = new WeakSet();

function isError(error: unknown): error is Error {
    return isObject(error) && 'message' in error;
}

export function setupErrorListener(): void {
    Cypress.on('uncaught:exception', (error) => {
        // FIXME This should be handled with the application error handling mechanism,
        // but for some reason it isn't working.
        if (error.message.includes('ResizeObserver loop completed with undelivered notifications.')) {
            return false;
        }

        return true;
    });

    Cypress.on('window:before:load', (window) => {
        window.__aerogelEvents__ = {
            error: ({ error, message }) => {
                if (window.__aerogelDisableErrorHandling__) {
                    return;
                }

                if (!isError(error)) {
                    throw new Error(message ?? toString(error));
                }

                if (knownErrors.has(error)) {
                    return;
                }

                if (message) {
                    error = new Error(message, { cause: error });
                }

                knownErrors.add(error as Error);

                throw error;
            },
        };
    });
}
