import baseTest from '@playwright/test';

import { expect } from './matchers';
import { setupPage } from './page';

export const test = baseTest.extend({
    page: async ({ page }, use) => {
        await setupPage(page);
        await use(page);
    },
});

test.use({ storageState: { cookies: [], origins: [] } });

export { setupPage } from './page';
export { expect };
