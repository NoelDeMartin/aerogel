import type { Page } from '@playwright/test';
import type { GetModelInput, ModelsRegistry } from 'soukai-bis';

export async function create<T extends keyof ModelsRegistry>(
    page: Page,
    name: T,
    data: GetModelInput<ModelsRegistry[T]>,
): Promise<void> {
    await page.evaluate(
        async ({ modelName, modelData }) => {
            if (!window.testingRuntime) {
                throw new Error('Testing runtime is not available');
            }

            await window.testingRuntime.model(modelName as string).create(modelData);
        },
        { modelName: name, modelData: data },
    );
}

export async function count<T extends keyof ModelsRegistry>(page: Page, name: T): Promise<number> {
    return page.evaluate(async (modelName) => {
        if (!window.testingRuntime) {
            throw new Error('Testing runtime is not available');
        }

        const instances = await window.testingRuntime.model(modelName as string).all();

        return instances.length;
    }, name);
}
