import { dontSee, see, test } from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await page.goto('/datatables');
});

test('Shows data tables', async ({ page }) => {
    await see(page, 'Data Tables');

    await see(page, 'John Doe');
    await see(page, 'john.smith@example.com');
    await see(page, 'Showing 1 to 10 of 104 people');
    await dontSee(page, 'Person 7');
});
