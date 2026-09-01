import type { Page } from '@playwright/test';

export async function setupEnv(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.__AEROGEL_E2E__ = true;
    });
}
