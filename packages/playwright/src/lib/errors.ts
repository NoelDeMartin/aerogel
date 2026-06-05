import type { Page } from '@playwright/test';

export async function disableErrorHandling(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.__aerogelDisableErrorHandling__ = true;
    });
}
