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
    waitSync,
} from '@aerogel/playwright';
import { urlClean } from '@noeldemartin/utils';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/local-first');
});

test('Manipulates Tasks', async ({ page }) => {
    const updateTask = interceptRequests(page, 'PATCH', podUrl('/tasks/*'));
    const deleteTask = interceptRequests(page, 'DELETE', podUrl('/tasks/*'));

    // Log in
    await press(page, 'Configuration');
    await press(page, 'Connect account');
    await input(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await input(page, 'Login url').press('Enter');
    await solidLogin(page);
    await waitSync(page);
    await press(page, 'Open account');
    await see(page, 'Alice Cooper');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Alice Cooper');

    // Creates local tasks
    await input(page, 'Task name').fill('Hello World!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await input(page, 'Task name').fill('It works!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    // Sync tasks
    await waitSync(page);

    expect(updateTask.all).toHaveLength(3);
    expect(updateTask.nth(1)?.url.endsWith('.meta')).toBe(true);
    expect(updateTask.nth(1)?.body).toContain('Tasks');

    const updateBodies = updateTask.slice(1, 3).map((request) => String(request.body));
    expect(updateBodies.some((body) => body.includes('Hello World!'))).toBe(true);
    expect(updateBodies.some((body) => body.includes('It works!'))).toBe(true);

    await matchImageSnapshot(page);

    // Deletes local tasks
    await press(page, 'Delete \'It works!\'');
    await dontSee(page, 'It works!');

    // Sync tasks
    await waitSync(page);

    expect(deleteTask.all).toHaveLength(0);
    expect(updateTask.all).toHaveLength(4);
    expect(updateTask.nth(4)?.body).toContain('Tombstone');
});
