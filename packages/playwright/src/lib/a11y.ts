import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export type InputOptions = {
    description?: string;
};

export type PressOptions = {
    within?: Locator;
    selector?: string;
};

export type SeeOptions = {
    srOnly?: boolean;
    timeout?: number;
    within?: Locator;
};

function findByA11yText(scope: Page | Locator, text: string): Locator {
    return scope
        .getByText(text, { exact: false })
        .or(scope.locator(`[aria-label="${text}"]`))
        .first();
}

export function input(page: Page, label: string, options: InputOptions = {}): Locator {
    const locator = page.getByLabel(label, { exact: true });

    if (options.description) {
        return locator.filter({
            has: page.locator(`[aria-description="${options.description}"], [aria-describedby]`),
        });
    }

    return locator;
}

export async function press(page: Page, label: string, options: PressOptions = {}): Promise<void> {
    const targetSelector =
        options.selector ?? 'button:visible, a:visible, label:visible, details:visible, [role="menuitem"]:visible';
    const findTarget = (scope: Page | Locator) =>
        scope
            .locator(targetSelector)
            .filter({ hasText: label })
            .or(scope.locator(`[aria-label="${label}"]`))
            .first();

    if (options.within) {
        await findTarget(options.within).click();

        return;
    }

    const dialog = page.locator('[role="dialog"][data-state="open"]:not([aria-hidden="true"])').last();
    const inDialog = findTarget(dialog);
    const locator = (await inDialog.count()) > 0 ? inDialog : findTarget(page);

    await locator.click();
}

export async function comboboxSelect(page: Page, labelOrSelector: string, value: string): Promise<void> {
    await page.waitForTimeout(300);
    const label = page.locator('label[for]').filter({ hasText: labelOrSelector }).first();
    const id = await label.getAttribute('for');

    await page.locator(id ? `#${id}` : labelOrSelector).click();
    await page.waitForTimeout(300);
    await page.locator('*[role="option"]').filter({ hasText: value }).first().click();
}

export async function see(
    page: Page,
    text: string,
    selectorOrOptions: string | SeeOptions = {},
    options: SeeOptions = {},
): Promise<Locator> {
    const srOnly = typeof selectorOrOptions === 'string' ? options.srOnly : selectorOrOptions.srOnly;
    const baseOptions = typeof selectorOrOptions === 'string' ? options : selectorOrOptions;
    const timeout = baseOptions.timeout;
    const scope = baseOptions.within ?? page;
    const locator =
        typeof selectorOrOptions === 'string'
            ? scope.locator(selectorOrOptions).filter({ hasText: text }).first()
            : findByA11yText(scope, text);

    if (srOnly) {
        await expect(locator).toBeAttached({ timeout });
    } else {
        await expect(locator).toBeVisible({ timeout });
    }

    return locator;
}

export async function seeImage(page: Page, alt: string): Promise<void> {
    const locator = page.locator(`img[alt="${alt}"]`).first();

    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
}

export async function dontSee(page: Page, text: string, options: SeeOptions = {}): Promise<void> {
    const scope = options.within ?? page;

    await expect(findByA11yText(scope, text)).not.toBeVisible({ timeout: options.timeout });
}
