import { isObject, toString } from '@noeldemartin/utils';
import type { Page } from '@playwright/test';

const knownErrors = new WeakSet();

function isError(error: unknown): error is Error {
    return isObject(error) && 'message' in error;
}

export async function setupErrorListener(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.__aerogelEvents__ = {
            error: ({ error, message }: { error: unknown; message?: string }) => {
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

    page.on('pageerror', (exception) => {
        if (exception.message.includes('ResizeObserver loop completed with undelivered notifications.')) {
            return;
        }

        throw exception;
    });
}
