import { matchImageSnapshot, see, seeImage, test } from '@aerogel/playwright';
import { resolve } from 'path';

test.beforeEach(async ({ page }) => {
    await page.goto('/content');
});

test('Shows formatted content', async ({ page }) => {
    await page.route('https://placecats.com/600/300', async (route) => {
        await route.fulfill({ path: resolve(import.meta.dirname, 'fixtures/kitten.jpg') });
    });

    await page.goto('/content'); // reload to apply route intercept if needed

    await see(page, 'This is an example');
    await see(page, 'bold', 'strong');
    await see(page, 'italic', 'em');
    await see(page, 'code', 'code');
    await see(page, 'One', 'li');
    await see(page, 'Three', 'li');
    await seeImage(page, 'A cute kitten');

    await matchImageSnapshot(page);
});
