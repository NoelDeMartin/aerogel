import { test as base, expect } from '@playwright/test';

import { resetStorage } from './storage';
import { setupErrorListener } from './errors';

export const test = base.extend<{ resetStorage: void }>({
    page: async ({ page }, use) => {
        await setupErrorListener(page);
        await use(page);
    },
    resetStorage: [
        async ({ page, baseURL }, use) => {
            await resetStorage(page, baseURL);
            await use();
        },
        { auto: true },
    ],
});

export { expect };
