import {
    ariaLabel,
    count,
    create,
    disableErrorHandling,
    dontSee,
    expect,
    matchImageSnapshot,
    press,
    see,
    test,
} from '@aerogel/playwright';

test.beforeEach(async ({ page }) => {
    await disableErrorHandling(page);
    await page.goto('/errors');
});

test('Handles runtime errors', async ({ page }) => {
    // Error with stack trace
    await press(page, 'Throw error');
    await ariaLabel(page, 'View error logs').click();
    await see(page, 'Errors (1)');
    await press(page, 'Close');
    await see(page, 'Something went wrong, but it\'s not your fault.');
    await ariaLabel(page, 'View details').click();
    await see(page, 'Copy to clipboard');
    await see(page, 'Log to console');
    await expect(page.locator('a', { hasText: 'Report in GitHub' })).toBeVisible();
    await see(page, 'This error was thrown for testing purposes');
    await see(page, 'throwError');
    await see(page, 'Errors.vue');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Something went wrong, but it\'s not your fault.');

    // Error with no trace
    await press(page, 'Throw error (no trace)');
    await ariaLabel(page, 'View error logs').click();
    await see(page, 'Errors (2)');

    await page.locator('li', { hasText: 'Test Error' }).locator('[aria-label="View details"]').click();
    await expect(page.locator('[role="dialog"]').filter({ hasText: 'Test Error' }).last()).toBeVisible();

    // All errors
    await see(page, 'Test Error (1/2)');
    await ariaLabel(page, 'Show next report').click();
    await see(page, 'Error (2/2)');
    await see(page, 'throwError');
    await see(page, 'Errors.vue');

    // Normalize stacktrace
    await page.locator('[role="dialog"] pre').evaluate((el) => el.textContent = '[stacktrace]');
    await matchImageSnapshot(page);
});

test('Handles startup crashes', async ({ page }) => {
    await see(page, 'Test Startup Crash');
    await press(page, 'Test Startup Crash');
    await see(page, 'There was a problem starting the application');

    await matchImageSnapshot(page);

    await press(page, 'View error details');
    await see(page, 'This is an error caused during application startup');
});

test('Purges devices', async ({ page }) => {
    await create(page, 'LocalTask', { name: 'For my next trick, I\'ll make you disappear' });

    expect(await count(page, 'LocalTask')).toBe(1);

    await see(page, 'Test Startup Crash');
    await press(page, 'Test Startup Crash');
    await press(page, 'Purge device');

    const dialog = page.locator('[role="dialog"]', { hasText: 'Delete everything' });
    await dialog.locator('button', { hasText: 'Purge device' }).click();

    await see(page, 'Welcome to Aerogel!');

    expect(await count(page, 'LocalTask')).toBe(0);
});
