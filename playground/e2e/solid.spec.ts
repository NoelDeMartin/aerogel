import {
    dontSee,
    expect,
    input,
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
    await input(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await input(page, 'Login url').press('Enter');
    await solidLogin(page);
    await see(page, 'You are logged in as Alice Cooper!');

    // Creates tasks
    await input(page, 'Task name').fill('Hello World!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await input(page, 'Task name').fill('It works!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    await expect.poll(() => updateTask.all).toHaveLength(3);

    expect(updateTask.nth(1)?.url.endsWith('.meta')).toBe(true);
    expect(updateTask.nth(1)?.body).toContain('Tasks');
    expect(updateTask.nth(2)?.body).toContain('Hello World!');
    expect(updateTask.nth(3)?.body).toContain('It works!');

    await matchImageSnapshot(page);

    // Deletes tasks
    await press(page, 'Delete \'It works!\'');
    await dontSee(page, 'It works!');

    expect(deleteTask.all).toHaveLength(1);

    // Log out
    await press(page, 'logout');
    await press(page, 'Log out', { within: page.getByRole('dialog', { name: 'Log out from this device?' }) });

    await dontSee(page, 'Logging out');
    await page.goto('/solid');
    await dontSee(page, 'You are logged in');
    await see(page, 'Log in');
});
