import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export type SeeOptions = {
    srOnly?: boolean;
    timeout?: number;
};

export type AriaInputOptions = {
    description?: string;
};

export function a11yGet(page: Page, text: string): Locator {
    return page
        .getByText(text, { exact: false })
        .or(page.locator(`[aria-label="${text}"]`))
        .first();
}

export function ariaLabel(page: Page, label: string): Locator {
    return page.locator(`[aria-label="${label}"]`);
}

export function ariaInput(page: Page, label: string, options: AriaInputOptions = {}): Locator {
    const locator = page.getByLabel(label, { exact: true });

    if (options.description) {
        return locator.filter({
            has: page.locator(`[aria-description="${options.description}"], [aria-describedby]`),
        });
    }

    return locator;
}

export async function dontSee(page: Page, text: string, options?: { timeout?: number }): Promise<void> {
    await expect(a11yGet(page, text)).not.toBeVisible({ timeout: options?.timeout });
}

export async function press(page: Page, label: string, selector?: string): Promise<void> {
    const targetSelector =
        selector ?? 'button:visible, a:visible, label:visible, details:visible, [role="menuitem"]:visible';
    const dialog = page.locator('[role="dialog"][data-state="open"]:not([aria-hidden="true"])').last();
    const inDialog = dialog.locator(targetSelector).filter({ hasText: label });
    const locator =
        (await inDialog.count()) > 0
            ? inDialog.first()
            : page.locator(targetSelector).filter({ hasText: label }).first();

    await locator.click();
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
    const locator =
        typeof selectorOrOptions === 'string'
            ? page.locator(selectorOrOptions).filter({ hasText: text }).first()
            : a11yGet(page, text);

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

export async function comboboxSelect(page: Page, labelOrSelector: string, value: string): Promise<void> {
    await page.waitForTimeout(300);
    const label = page.locator('label[for]').filter({ hasText: labelOrSelector }).first();
    const id = await label.getAttribute('for');

    await page.locator(id ? `#${id}` : labelOrSelector).click();
    await page.waitForTimeout(300);
    await page.locator('*[role="option"]').filter({ hasText: value }).first().click();
}
