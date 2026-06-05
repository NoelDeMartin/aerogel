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

    // Creates local tasks (click + pressSequentially mimics Cypress .type() on Vue controlled inputs)
    const taskName = ariaInput(page, 'Task name');
    await taskName.click();
    await taskName.pressSequentially('Hello World!', { delay: 50 });
    await taskName.press('Enter');
    await see(page, 'Hello World!');
    await taskName.click();
    await taskName.pressSequentially('It works!', { delay: 50 });
    await taskName.press('Enter');
    await see(page, 'It works!');

    expect(updateTask.all).toHaveLength(0);

    // Sync tasks
    await waitSync(page);
    expect(updateTask.all).toHaveLength(2);
    expect(updateTask.nth(1)?.body).toContain('Hello World!');
    expect(updateTask.nth(2)?.body).toContain('It works!');

    await matchImageSnapshot(page);

    // Deletes local tasks
    await ariaLabel(page, 'Delete \'It works!\'').click();
    await dontSee(page, 'It works!');

    expect(deleteTask.all).toHaveLength(0);

    // Sync tasks
    await waitSync(page);

    expect(deleteTask.all).toHaveLength(0);
    expect(updateTask.all).toHaveLength(3);
    expect(updateTask.nth(3)?.body).toContain('Tombstone');
});
