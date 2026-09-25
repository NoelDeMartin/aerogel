import { input, matchImageSnapshot, press, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
});

test('Uses forms', async ({ page }) => {
    await see(page, 'Accept Terms & Conditions');
    await matchImageSnapshot(page);

    await input(page, 'Name').fill('Walter White');
    await input(page, 'Roles').click();
    await press(page, 'Cook');
    await press(page, 'Kingpin');
    await page.keyboard.press('Escape');
    await press(page, 'Accept Terms & Conditions');
    await press(page, 'Say My Name');

    await see(page, 'Hello, Walter White! (Cook, Kingpin)');
});
