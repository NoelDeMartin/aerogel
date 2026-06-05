import {
    ariaInput,
    ariaLabel,
    dontSee,
    expect,
    matchImageSnapshot,
    podUrl,
    press,
    see,
    serverUrl,
    solidLogin,
    solidReset,
    test,
} from '@aerogel/playwright';
import type { Request } from '@playwright/test';
import { urlClean } from '@noeldemartin/utils';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/solid');
});

test('Manipulates Tasks', async ({ page }) => {
    const updateRequests: Request[] = [];
    const deleteRequests: Request[] = [];

    const trackRequests = (request: Request) => {
        if (request.url().startsWith(podUrl('/tasks/'))) {
            if (request.method() === 'PATCH') {
                updateRequests.push(request);
            } else if (request.method() === 'DELETE') {
                deleteRequests.push(request);
            }
        }
    };

    // Log in
    await ariaInput(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await ariaInput(page, 'Login url').press('Enter');
    await solidLogin(page);
    await see(page, 'You are logged in as Alice Cooper!');

    page.on('request', trackRequests);

    // Creates tasks
    await ariaInput(page, 'Task name').fill('Hello World!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await ariaInput(page, 'Task name').fill('It works!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    // Wait to make sure requests are processed/captured
    await page.waitForTimeout(500);

    expect(updateRequests).toHaveLength(2);
    expect(updateRequests[0]?.postData()).toContain('Hello World!');
    expect(updateRequests[1]?.postData()).toContain('It works!');

    await matchImageSnapshot(page);

    // Deletes tasks
    await ariaLabel(page, 'Delete \'It works!\'').click();
    await dontSee(page, 'It works!');

    await page.waitForTimeout(500);
    expect(deleteRequests).toHaveLength(1);

    // Log out
    await press(page, 'logout');
    const dialog = page.locator('[role="dialog"]', { hasText: 'Log out from this device?' });
    await dialog.locator('button', { hasText: 'Log out' }).click();

    await dontSee(page, 'Logging out');
    await page.goto('/solid');
    await dontSee(page, 'You are logged in');
    await see(page, 'Log in');
});
