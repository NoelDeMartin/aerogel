import {
    countModels,
    createModel,
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
    await press(page, 'View error logs');
    await see(page, 'Errors (1)');
    await press(page, 'Close');
    await see(page, 'Something went wrong, but it\'s not your fault.');
    await press(page, 'View details');
    await see(page, 'Copy to clipboard');
    await see(page, 'Log to console');
    await see(page, 'Report in GitHub');
    await see(page, 'This error was thrown for testing purposes');
    await see(page, 'throwError');
    await see(page, 'Errors.vue');
    await page.keyboard.press('Escape');
    await dontSee(page, 'Something went wrong, but it\'s not your fault.');

    // Error with no trace
    await press(page, 'Throw error (no trace)');
    await press(page, 'View error logs');
    await see(page, 'Errors (2)');
    await press(page, 'View details', { within: page.getByRole('listitem').filter({ hasText: 'Test Error' }) });
    await see(page, 'Test Error', { within: page.getByRole('dialog').filter({ hasText: 'Test Error' }) });

    // All errors
    await see(page, 'Test Error (1/2)');
    await press(page, 'Show next report');
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
    await createModel(page, 'LocalTask', { name: 'For my next trick, I\'ll make you disappear' });

    expect(await countModels(page, 'LocalTask')).toBe(1);

    await see(page, 'Test Startup Crash');
    await press(page, 'Test Startup Crash');
    await press(page, 'Purge device');
    await press(page, 'Purge device', { within: page.getByRole('dialog', { name: 'Delete everything' }) });
    await see(page, 'Welcome to Aerogel!');

    expect(await countModels(page, 'LocalTask')).toBe(0);
});
