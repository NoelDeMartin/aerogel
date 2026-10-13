import type { Page } from '@playwright/test';
import type { GetModelInput, ModelsRegistry } from 'soukai-bis';

export type ModelProxy<T> = { url: string } & {
    [
        K in keyof T as K extends string ? (T[K] extends (...args: never[]) => unknown ? K : never) : never
    ]: T[K] extends (...args: infer TArgs) => unknown ? (...args: TArgs) => Promise<void> : never;
};

function createModelProxy<T extends keyof ModelsRegistry>(
    page: Page,
    name: T,
    url: string,
): ModelProxy<InstanceType<ModelsRegistry[T]>> {
    return new Proxy(Object.create(null), {
        get(_, property) {
            if (property === 'url') {
                return url;
            }

            if (typeof property !== 'string' || property === 'then') {
                return undefined;
            }

            return (...args: unknown[]) => callModelMethod(page, name, url, property, args);
        },
    });
}

async function callModelMethod(
    page: Page,
    name: keyof ModelsRegistry,
    url: string,
    method: string,
    args: unknown[],
): Promise<void> {
    await page.evaluate(
        async ({ modelName, modelUrl, modelMethod, methodArgs }) => {
            if (!window.testingRuntime) {
                throw new Error('Testing runtime is not available');
            }

            const instance = await window.testingRuntime.model(modelName as string).findOrFail(modelUrl);
            const callable = Reflect.get(instance, modelMethod);

            if (typeof callable !== 'function') {
                throw new Error(`${modelName as string} model does not have a '${modelMethod}' method`);
            }

            await callable.apply(instance, methodArgs);
        },
        { modelName: name, modelUrl: url, modelMethod: method, methodArgs: args },
    );
}

export async function createModel<T extends keyof ModelsRegistry>(
    page: Page,
    name: T,
    data: GetModelInput<ModelsRegistry[T]>,
): Promise<ModelProxy<InstanceType<ModelsRegistry[T]>>> {
    const url = await page.evaluate(
        async ({ modelName, modelData }) => {
            if (!window.testingRuntime) {
                throw new Error('Testing runtime is not available');
            }

            const model = await window.testingRuntime.model(modelName as string).create(modelData);

            return model.url;
        },
        { modelName: name, modelData: data },
    );

    return createModelProxy(page, name, url);
}

export async function countModels<T extends keyof ModelsRegistry>(page: Page, name: T): Promise<number> {
    return page.evaluate(async (modelName) => {
        if (!window.testingRuntime) {
            throw new Error('Testing runtime is not available');
        }

        const instances = await window.testingRuntime.model(modelName as string).all();

        return instances.length;
    }, name);
}
