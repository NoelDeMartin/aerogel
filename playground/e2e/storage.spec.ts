import { ariaInput, ariaLabel, dontSee, matchImageSnapshot, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/storage');
});

test('Creates tasks', async ({ page }) => {
    await ariaInput(page, 'Task name').fill('Hello World!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await ariaInput(page, 'Task name').fill('It works!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    await matchImageSnapshot(page);
});

test('Deletes tasks', async ({ page }) => {
    await ariaInput(page, 'Task name').fill('Hello World!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await ariaLabel(page, 'Delete \'Hello World!\'').click();
    await dontSee(page, 'Hello World!');
});
