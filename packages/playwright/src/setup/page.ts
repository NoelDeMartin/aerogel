import type { Page } from '@playwright/test';

import { setupEnv } from './env';
import { setupErrorListener } from './errors';

export async function setupPage(page: Page): Promise<void> {
    await setupEnv(page);
    await setupErrorListener(page);
}
