import { input, press } from '@aerogel/playwright/lib/a11y';
import { waitSync } from '@aerogel/playwright/lib/sync';
import { urlClean } from '@noeldemartin/utils';
import type { Page } from '@playwright/test';
import { serverUrl, solidLogin } from 'playwright-solid';

export async function localFirstLogin(page: Page): Promise<void> {
    await press(page, 'Configuration');
    await press(page, 'Connect account');
    await input(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await input(page, 'Login url').press('Enter');
    await solidLogin(page);
    await waitSync(page);
}
