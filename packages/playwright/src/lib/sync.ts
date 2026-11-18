import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dontSee, see } from './a11y';

async function dontSeeConflictDialogs(page: Page): Promise<void> {
    const accountModalTitle = page.getByRole('heading', { name: 'Account', exact: true });

    await expect(page.getByRole('dialog').filter({ hasNot: accountModalTitle })).toHaveCount(0);
}

export async function waitSync(page: Page): Promise<void> {
    await see(page, 'Synchronization in progress');
    await dontSee(page, 'Synchronization in progress', { timeout: 10000 });
    await dontSeeConflictDialogs(page);
    await page.waitForTimeout(100);
}
