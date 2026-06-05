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
    await ariaLabel(page, 'Configuration').click();
    await press(page, 'Connect account');
    await ariaInput(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await ariaInput(page, 'Login url').press('Enter');
    await solidLogin(page);
    await waitSync(page);
    await ariaLabel(page, 'Open account').click();
    await see(page, 'Alice Cooper');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Alice Cooper');

    // Creates local tasks
    await ariaInput(page, 'Task name').fill('Hello World!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await ariaInput(page, 'Task name').fill('It works!');
    await ariaInput(page, 'Task name').press('Enter');
    await see(page, 'It works!');

    // Sync tasks
    await waitSync(page);

    expect(updateTask.all).toHaveLength(3);
    expect(updateTask.nth(1)?.url.endsWith('.meta')).toBe(true);
    expect(updateTask.nth(1)?.body).toContain('Tasks');
    expect(updateTask.nth(2)?.body).toContain('Hello World!');
    expect(updateTask.nth(3)?.body).toContain('It works!');

    await matchImageSnapshot(page);

    // Deletes local tasks
    await ariaLabel(page, 'Delete \'It works!\'').click();
    await dontSee(page, 'It works!');

    // Sync tasks
    await waitSync(page);

    expect(deleteTask.all).toHaveLength(0);
    expect(updateTask.all).toHaveLength(4);
    expect(updateTask.nth(4)?.body).toContain('Tombstone');
});
