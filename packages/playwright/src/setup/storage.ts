import type { Page } from '@playwright/test';

export async function resetStorage(page: Page, baseURL?: string | null): Promise<void> {
    const url = page.url();
    const origin = url !== 'about:blank' ? new URL(url).origin : (baseURL ?? 'http://localhost:5001');
    const client = await page.context().newCDPSession(page);

    await client.send('Storage.clearDataForOrigin', {
        origin,
        storageTypes: 'all',
    });
}
