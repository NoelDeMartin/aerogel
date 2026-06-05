import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function matchImageSnapshot(page: Page, name?: string): Promise<void> {
    if (!process.env.SNAPSHOTS && !process.env.PLAYWRIGHT_SNAPSHOTS) {
        return;
    }

    if (name) {
        await expect(page).toHaveScreenshot(`${name}.png`, { animations: 'disabled' });
    } else {
        await expect(page).toHaveScreenshot({ animations: 'disabled' });
    }
}
