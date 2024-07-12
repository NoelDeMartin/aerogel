import { isObject, toString } from '@noeldemartin/utils';

const knownErrors = new WeakSet();

function isError(error: unknown): error is Error {
    return isObject(error) && 'message' in error;
}

export function setupErrorListener(): void {
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
