import type { Page } from '@playwright/test';

export async function setupErrorListener(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.__aerogelEvents__ = {
            error: ({ error, message }: { error: unknown; message?: string }) => {
                if (window.__aerogelDisableErrorHandling__) {
                    return;
                }

                if (typeof error !== 'object' || error === null || !('message' in error)) {
                    throw new Error(message ?? String(error));
                }

                if ('__aerogelKnownError__' in error) {
                    return;
                }

                if (message) {
                    error = new Error(message, { cause: error });
                }

                (error as Record<string, unknown>).__aerogelKnownError__ = true;

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
