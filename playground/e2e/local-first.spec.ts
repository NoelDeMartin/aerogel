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
    waitSync,
} from '@aerogel/playwright';
import type { Request } from '@playwright/test';
import { urlClean } from '@noeldemartin/utils';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/local-first');
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
    await ariaLabel(page, 'Configuration').click();
    await press(page, 'Connect account');
    await ariaInput(page, 'Login url').fill(urlClean(serverUrl(), { protocol: false }));
    await ariaInput(page, 'Login url').press('Enter');
    await solidLogin(page);
    await waitSync(page);
    await ariaLabel(page, 'Open account').click();
    await see(page, 'Alice Cooper');
    await page.keyboard.press('Escape');

    page.on('request', trackRequests);

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

    await page.waitForTimeout(500);
    expect(updateRequests).toHaveLength(0);

    // Sync tasks
    await waitSync(page);

    await page.waitForTimeout(500);
    expect(updateRequests).toHaveLength(2);
    const updateBodies = updateRequests.map((request) => request.postData() ?? '');
    expect(updateBodies.some((body) => body.includes('Hello World!'))).toBe(true);
    expect(updateBodies.some((body) => body.includes('It works!'))).toBe(true);

    await matchImageSnapshot(page);

    // Deletes local tasks
    await ariaLabel(page, 'Delete \'It works!\'').click();
    await dontSee(page, 'It works!');

    expect(deleteRequests).toHaveLength(0);

    // Sync tasks
    await waitSync(page);

    await page.waitForTimeout(500);
    expect(deleteRequests).toHaveLength(0);
    expect(updateRequests).toHaveLength(3);
    expect(updateRequests[2]?.postData()).toContain('Tombstone');
});
