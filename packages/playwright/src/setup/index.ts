import baseTest from '@playwright/test';

import { expect } from './matchers';
import { setupErrorListener } from './errors';

export const test = baseTest.extend({
    page: async ({ page }, use) => {
        await setupErrorListener(page);
        await use(page);
    },
});

test.use({ storageState: { cookies: [], origins: [] } });

export { expect };
