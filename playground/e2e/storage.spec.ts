import { dontSee, input, matchImageSnapshot, press, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/storage');
});

test('Creates tasks', async ({ page }) => {
    await input(page, 'Task name').fill('Hello World!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await input(page, 'Task name').fill('It works!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    await matchImageSnapshot(page);
});

test('Deletes tasks', async ({ page }) => {
    await input(page, 'Task name').fill('Hello World!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await press(page, 'Delete \'Hello World!\'');
    await dontSee(page, 'Hello World!');
});
