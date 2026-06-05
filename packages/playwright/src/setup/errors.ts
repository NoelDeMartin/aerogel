import type { Page } from '@playwright/test';

export async function setupErrorListener(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.__aerogelEvents__ = {
            error: ({ error, message }: { error: unknown; message?: string }) => {
                if (window.__aerogelDisableErrorHandling__) {
                    return;
                }

                const errorToThrow = error instanceof Error ? error : new Error(message || String(error));

                setTimeout(() => {
                    throw errorToThrow;
                });
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
