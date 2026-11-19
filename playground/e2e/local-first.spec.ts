import {
    authenticate,
    createModel,
    dontSee,
    expect,
    input,
    interceptRequests,
    localFirstLogin,
    matchImageSnapshot,
    podUrl,
    press,
    see,
    setupPage,
    solidReset,
    test,
    waitSync,
} from '@aerogel/playwright';
import { urlRoute } from '@noeldemartin/utils';
import type { Browser, Page } from '@playwright/test';

async function openAnotherDevice(browser: Browser): Promise<Page> {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();

    await setupPage(page);
    await page.goto('/local-first');

    return page;
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/local-first');
});

test('Manipulates Tasks', async ({ page }) => {
    const updateTask = interceptRequests(page, 'PATCH', podUrl('/tasks/*'));
    const deleteTask = interceptRequests(page, 'DELETE', podUrl('/tasks/*'));

    // Log in
    await localFirstLogin(page);
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
    await press(page, "Delete 'It works!'");
    await dontSee(page, 'It works!');

    // Sync tasks
    await waitSync(page);

    expect(deleteTask.all).toHaveLength(0);
    expect(updateTask.all).toHaveLength(4);
    expect(updateTask.nth(4)?.body).toContain('Tombstone');
});

test('Restores tasks deleted on another device', async ({ page, browser }) => {
    // Create task
    await localFirstLogin(page);

    const task = await createModel(page, 'LocalTask', { name: 'Hello World!' });

    await see(page, 'Hello World!');
    await waitSync(page);

    // Rename offline while it's deleted on another device
    await page.context().setOffline(true);
    await task.update({ name: 'Hello Conflicts!' });
    await see(page, 'Hello Conflicts!');

    const anotherDevice = await openAnotherDevice(browser);

    await localFirstLogin(anotherDevice);
    await press(anotherDevice, "Delete 'Hello World!'");
    await dontSee(anotherDevice, 'Hello World!');
    await waitSync(anotherDevice);
    await anotherDevice.context().close();

    // Restore
    await page.context().setOffline(false);
    await press(page, 'Open account');
    await press(page, 'Synchronize', { role: 'button' });

    const conflict = page.getByRole('dialog', { name: 'Deleted on another device' });

    await expect(conflict).toContainText('was deleted on another device, but it has changes on this device');
    await conflict.getByRole('button', { name: 'Restore' }).click();
    await waitSync(page);
    await page.keyboard.press('Escape');

    await see(page, 'Hello Conflicts!');

    const fetch = await authenticate();
    const response = await fetch(urlRoute(task.url));

    expect(await response.text()).not.toContain('Tombstone');
});

test('Counts local changes by user action', async ({ page }) => {
    // Make changes offline
    await localFirstLogin(page);
    await page.context().setOffline(true);

    await input(page, 'Task name').fill('Hello World!');
    await input(page, 'Task name').press('Enter');
    await see(page, 'Hello World!');

    await input(page, 'Task name').fill('Discarded');
    await input(page, 'Task name').press('Enter');
    await see(page, 'Discarded');
    await press(page, "Delete 'Discarded'");
    await dontSee(page, 'Discarded');

    const task = await createModel(page, 'LocalTask', { name: 'It works!' });

    await press(page, 'Open account');
    await see(page, 'There are 2 local changes.');
    await page.keyboard.press('Escape');

    // Comment on a task (one change, even if it saves the comment and the task)
    await task.comment('Commented together with its task');

    await press(page, 'Open account');
    await see(page, 'There are 3 local changes.');
    await page.keyboard.press('Escape');

    // Sync
    await page.context().setOffline(false);
    await press(page, 'Open account');
    await press(page, 'Synchronize', { role: 'button' });
    await waitSync(page);
    await see(page, 'Everything is up to date.');
});
