import type { Page } from '@playwright/test';

import { dontSee, see } from './a11y';

export async function waitSync(page: Page): Promise<void> {
    await see(page, 'Synchronization in progress');
    await dontSee(page, 'Synchronization in progress', { timeout: 10000 });
    await page.waitForTimeout(100);
}
