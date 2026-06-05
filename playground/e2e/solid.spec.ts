import {
    ariaInput,
    ariaLabel,
    dontSee,
    expect,
    interceptRequests,
    matchImageSnapshot,
    podUrl,
    press,
    see,
    serverUrl,
    solidLogin,
    solidReset,
    test,
} from '@aerogel/playwright';
import { urlClean } from '@noeldemartin/utils';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/solid');
});

test('Manipulates Tasks', async ({ page }) => {
    const updateTask = interceptRequests(page, 'PATCH', podUrl('/tasks/*'));
    const deleteTask = interceptRequests(page, 'DELETE', podUrl('/tasks/*'));

    // Log in
    await ariaInput(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await ariaInput(page, 'Login url').press('Enter');
    await solidLogin(page);
    await see(page, 'You are logged in as Alice Cooper!');

    // Creates tasks
    await ariaInput(page, 'Task name').fill('Hello World!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await ariaInput(page, 'Task name').fill('It works!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    expect(updateTask.all).toHaveLength(2);
    expect(updateTask.nth(1)?.body).toContain('Hello World!');
    expect(updateTask.nth(2)?.body).toContain('It works!');

    await matchImageSnapshot(page);

    // Deletes tasks
    await ariaLabel(page, 'Delete \'It works!\'').click();
    await dontSee(page, 'It works!');

    expect(deleteTask.all).toHaveLength(1);

    // Log out
    await press(page, 'logout');
    const dialog = page.locator('[role="dialog"]', { hasText: 'Log out from this device?' });
    await dialog.locator('button', { hasText: 'Log out' }).click();

    await dontSee(page, 'Logging out');
    await page.goto('/solid');
    await dontSee(page, 'You are logged in');
    await see(page, 'Log in');
});
