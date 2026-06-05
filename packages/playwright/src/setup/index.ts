import { test as base, expect } from '@playwright/test';

import { setupErrorListener } from './errors';

export const test = base.extend({
    page: async ({ page }, use) => {
        await setupErrorListener(page);
        await use(page);
    },
});

test.use({ storageState: { cookies: [], origins: [] } });

export { expect };
