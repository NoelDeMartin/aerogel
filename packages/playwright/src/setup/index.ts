import baseTest from '@playwright/test';

import { setupEnv } from './env';
import { setupErrorListener } from './errors';
import { expect } from './matchers';

export const test = baseTest.extend({
    page: async ({ page }, use) => {
        await setupEnv(page);
        await setupErrorListener(page);
        await use(page);
    },
});

test.use({ storageState: { cookies: [], origins: [] } });

export { expect };
