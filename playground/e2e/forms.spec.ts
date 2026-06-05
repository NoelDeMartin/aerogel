import { input, matchImageSnapshot, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
});

test('Uses forms', async ({ page }) => {
    await see(page, 'Accept Terms & Conditions');
    await matchImageSnapshot(page);

    await input(page, 'Name').fill('Walter White');
    await input(page, 'Name').press('Enter');

    await see(page, 'Hello, Walter White!');
});
