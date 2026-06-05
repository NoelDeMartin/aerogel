import { ariaInput, matchImageSnapshot, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
});

test('Uses forms', async ({ page }) => {
    await see(page, 'Accept Terms & Conditions');
    await matchImageSnapshot(page);

    await ariaInput(page, 'Name').fill('Walter White');
    await ariaInput(page, 'Name').press('Enter');

    await see(page, 'Hello, Walter White!');
});
