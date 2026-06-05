import { dontSee, matchImageSnapshot, press, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/components');
});

test('All', async ({ page }) => {
    await matchImageSnapshot(page);
});

test('Modals', async ({ page }) => {
    await press(page, 'Alert');
    await see(page, 'How\'s your day going?');
    await matchImageSnapshot(page, 'Alert');
    await page.keyboard.press('Escape');
    await dontSee(page, 'How\'s your day going?');

    await press(page, 'Confirm');
    await see(page, 'You\'re about to do something dangerous');
    await see(page, 'Are you sure you want to continue?');
    await matchImageSnapshot(page, 'Confirm');
    await press(page, 'Of course!');
    await see(page, 'You were just eaten by a crocodile');
    await dontSee(page, 'Are you sure you want to continue?');
    await page.keyboard.press('Escape');

    await press(page, 'Confirm');
    await see(page, 'Are you sure you want to continue?');
    await press(page, 'Maybe not');
    await see(page, 'You dodged that bullet');
    await dontSee(page, 'Are you sure you want to continue?');
    await page.keyboard.press('Escape');

    await press(page, 'Loading');
    await see(page, 'The elfs are working, please wait...');
    await dontSee(page, 'The elfs are working, please wait...');

    await press(page, 'Nested');
    await see(page, 'Nested modal (1)');
    await see(page, 'Modals can be nested indefinitely');
    await press(page, 'When does this end?');
    await see(page, 'Nested modal (2)');
    await press(page, 'When does this end?');
    await see(page, 'Nested modal (3)');
    await matchImageSnapshot(page, 'Nested');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Nested modal (3)');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Nested modal (2)');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Nested modal (1)');

    await press(page, 'Custom content');
    await see(page, 'You can also create your own modals');
    await matchImageSnapshot(page, 'Custom');
    await press(page, 'Nice!');
    await dontSee(page, 'You can also create your own modals');
});

test('Toasts', async ({ page }) => {
    const section = page.locator('section', { has: page.locator('h2', { hasText: 'Toasts' }) });

    await section.locator('button:visible', { hasText: 'Default' }).first().click();
    await section.locator('button:visible', { hasText: 'Default with actions' }).first().click();
    await section.locator('button:visible', { hasText: 'Danger' }).first().click();
    await section.locator('button:visible', { hasText: 'Danger with actions' }).first().click();

    await matchImageSnapshot(page);
});
